"""Live Zoho Commerce MCP client.

Connects to the real Zoho Commerce MCP server at ZOHO_MCP_URL using either:
  - Primary: MCP Python SDK (mcp>=1.0.0) via streamablehttp_client
  - Fallback: raw httpx JSON-RPC 2.0

Actual Zoho Commerce MCP tool names and argument shapes discovered via tools/list:
  - list_all_products      → {parameters: {organization_id, ...}}
  - get_a_product          → {parameters: {organization_id}, path_parameters: {product_id}}
  - get_inventory_stock_details → {parameters: {organization_id, ...}}  (bulk report)
  - get_sales_by_products_report → {parameters: {organization_id, ...}} (bulk report)
  - list_all_sales_returns → {parameters: {organization_id, ...}}        (all returns)
  - list_coupons           → {parameters: {organization_id, ...}}

All tools require organization_id in their parameters object.
Bulk reports are fetched once and indexed by product/variant id.
"""

import asyncio
import json
import logging
import threading
import time
from datetime import datetime, timedelta
from typing import Any

import httpx

from app.config import get_settings

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Shared background event loop (one per process, daemon thread)
# ---------------------------------------------------------------------------
_loop: asyncio.AbstractEventLoop | None = None
_loop_lock = threading.Lock()


def _get_loop() -> asyncio.AbstractEventLoop:
    global _loop
    if _loop is None:
        with _loop_lock:
            if _loop is None:
                _loop = asyncio.new_event_loop()
                t = threading.Thread(target=_loop.run_forever, daemon=True)
                t.start()
    return _loop


def _run_async(coro, timeout: float = 30.0) -> Any:
    """Block the calling thread until the coroutine finishes on the shared loop."""
    future = asyncio.run_coroutine_threadsafe(coro, _get_loop())
    return future.result(timeout=timeout)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _coerce_int(val: Any, default: int = 0) -> int:
    try:
        return int(val or default)
    except (TypeError, ValueError):
        return default


def _coerce_float(val: Any, default: float = 0.0) -> float:
    try:
        return float(val or default)
    except (TypeError, ValueError):
        return default


def _extract_text(result: Any) -> Any:
    """Extract parsed JSON from an MCP SDK result or return the result as-is."""
    if result is None:
        return {}
    if isinstance(result, (dict, list)):
        return result
    # MCP SDK wraps content in a list of content objects with .text
    if hasattr(result, "content") and result.content:
        content = result.content[0]
        if hasattr(content, "text"):
            try:
                return json.loads(content.text)
            except (json.JSONDecodeError, TypeError):
                return content.text
    return {}


def _map_product(product: dict, variant: dict, sales_index: dict,
                 return_count: int, coupons: list[dict]) -> dict:
    """
    Merge data from Zoho Commerce MCP tools into the fused shape that
    to_safe_product() and the selector service expect.

    product       — from list_all_products or get_a_product (product level)
    variant       — first/primary variant (has rate, stock_on_hand, etc.)
    sales_index   — bulk sales map; lookup tries product_id THEN variant_id
                    (sales orders key by product_id, sales report keys may vary)
    return_count  — number of returns for this product
    coupons       — list of all active coupons (we pick first applicable)
    """
    # --- identity ---
    item_id = str(product.get("product_id") or product.get("item_id") or "")
    item_name = str(product.get("name") or product.get("item_name") or "").strip()
    variant_id = str(variant.get("variant_id") or "")

    # --- pricing ---
    rate = _coerce_float(
        variant.get("rate") or product.get("min_rate") or product.get("rate")
    )
    mrp_raw = variant.get("label_rate") or product.get("max_rate") or product.get("mrp")
    mrp = _coerce_float(mrp_raw) if mrp_raw and _coerce_float(mrp_raw) > rate else None

    # --- category ---
    # list_all_products: flat string "category_name"
    # get_a_product:     list "ancestor_categories" with [{name, ...}]
    cats = product.get("category_name")
    if not cats or not isinstance(cats, str):
        ancestor = product.get("ancestor_categories") or []
        if ancestor and isinstance(ancestor, list):
            cats = ancestor[0].get("name") or "Uncategorized"
        else:
            cats = str(product.get("item_categories") or product.get("category") or "Uncategorized")
    if isinstance(cats, list):
        cats = cats[0] if cats else "Uncategorized"

    # --- description ---
    description = (
        product.get("product_short_description") or
        product.get("product_description") or
        product.get("description") or
        ""
    )
    # Strip HTML tags from product_description
    import re
    description = re.sub(r"<[^>]+>", "", str(description)).strip()

    # --- attributes (specs) ---
    # Zoho Commerce surfaces product specs in three places:
    #   1. product.specifications — the main spec sheet, list of
    #      {specification_group_name, name, specification_value}
    #   2. variant.package_details — dimensions/weight
    #   3. variant.custom_fields — anything else the merchant added
    # We merge all three into a single flat dict keyed by spec name.
    attrs: dict = {}

    # 1) Spec sheet (richest source)
    for spec in (product.get("specifications") or []):
        if not isinstance(spec, dict):
            continue
        name  = (spec.get("name") or "").strip()
        value = spec.get("specification_value")
        group = (spec.get("specification_group_name") or "").strip()
        if not name or value in (None, ""):
            continue
        # Disambiguate spec names that repeat across groups (e.g. "Brand" under
        # both "Processor" and "Display").
        key = name if not group else (
            name if name.lower().startswith(group.lower()) else f"{group} {name}".strip()
        )
        attrs[key] = value

    # 2) Package details (universal spec: weight + dimensions)
    pkg = variant.get("package_details") or {}
    if isinstance(pkg, dict):
        w  = pkg.get("weight")
        wu = pkg.get("weight_unit") or ""
        if w not in (None, "", 0):
            attrs.setdefault("Weight", f"{w} {wu}".strip())
        L, W, H = pkg.get("length"), pkg.get("width"), pkg.get("height")
        du = pkg.get("dimension_unit") or ""
        if L and W and H:
            attrs.setdefault("Dimensions", f"{L} × {W} × {H} {du}".strip())

    # 3) Variant-level attribute1/2/3 (only used when populated)
    for i in (1, 2, 3):
        attr_name = product.get(f"attribute_name{i}") or variant.get(f"attribute_name{i}")
        attr_val  = (variant.get(f"attribute_option_name{i}") or
                     variant.get(f"attribute_option_data{i}"))
        if attr_name and attr_val:
            attrs.setdefault(str(attr_name), attr_val)

    # 4) Custom fields (merchant-defined extras)
    for cf in (variant.get("custom_fields") or []):
        label = cf.get("label") or cf.get("placeholder")
        val   = cf.get("value")
        if label and val not in (None, ""):
            attrs.setdefault(str(label), val)

    # 5) Brand — a useful public attribute that doesn't live in the spec sheet
    brand = product.get("brand") or variant.get("brand")
    if brand:
        attrs.setdefault("Brand", brand)

    # --- inventory ---
    stock = _coerce_int(
        variant.get("available_stock") or
        variant.get("stock_on_hand") or
        product.get("overall_stock")
    )

    # --- sales (from bulk sales report, keyed by variant_id) ---
    # The sales report keys by variant_id; the orders-aggregation fallback
    # keys by product_id. The fetcher indexes BOTH so either lookup works.
    units_sold = _coerce_int(sales_index.get(variant_id) or
                             sales_index.get(item_id))

    # --- returns ---
    return_rate = 0.0
    if return_count > 0 and units_sold > 0:
        return_rate = round(return_count / units_sold, 4)

    # --- promotions (first coupon that applies) ---
    active_promo: dict | None = None
    for coupon in coupons:
        status = (coupon.get("status") or "").lower()
        if status not in ("active", ""):
            continue
        disc_pct = _coerce_float(coupon.get("discount_percentage") or coupon.get("discount_percent"))
        disc_amt = _coerce_float(coupon.get("discount_amount") or coupon.get("discount_value"))
        if disc_pct:
            active_promo = {"discount_by": "percentage", "discount_value": disc_pct}
            break
        if disc_amt:
            active_promo = {"discount_by": "fixed_amount", "discount_value": disc_amt}
            break

    return {
        "item_id":         item_id,
        "item_name":       item_name,
        "description":     description,
        "rate":            rate,
        "mrp":             mrp,
        "item_categories": cats,
        "attributes":      attrs,
        "inventory": {
            "stock_on_hand":   stock,
            "available_stock": stock,
            "reorder_level":   0,
        },
        "sales": {
            "units_sold_30d": units_sold,
            "units_sold_7d":  0,
        },
        "returns": {
            "quantity_returned_30d": return_count,
            "return_rate":           return_rate,
        },
        "promotions": active_promo,
    }


# ---------------------------------------------------------------------------
# RealMCPClient
# ---------------------------------------------------------------------------

class RealMCPClient:
    """
    Zoho Commerce MCP client for the real Zoho Commerce MCP server.
    Mirrors MockMCPClient's interface so client.py factory can swap them.
    """

    # Per-process caches — bulk reports don't change often, so we avoid
    # re-fetching them for every product on every /compare call.
    _CACHE_TTL_SECONDS = 300

    def __init__(self, base_url: str, token: str = "", org_id: str = "") -> None:
        self._url    = base_url.rstrip("/")
        self._token  = token
        self._org_id = org_id
        self._sdk_available = self._check_sdk()
        # Bulk-data caches: (value, expires_at_epoch).
        self._sales_cache: tuple[dict[str, int], float] | None = None
        self._returns_cache: tuple[dict[str, int], float] | None = None
        self._coupons_cache: tuple[list[dict], float] | None = None
        log.info(
            "RealMCPClient init: url=%s org_id=%s sdk=%s",
            self._url, self._org_id, self._sdk_available
        )

    # ------------------------------------------------------------------ #
    # Transport selection                                                   #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _check_sdk() -> bool:
        try:
            import mcp  # noqa: F401
            return True
        except ImportError:
            return False

    def _mcp_headers(self) -> dict[str, str]:
        headers: dict[str, str] = {}
        if self._token:
            headers["Authorization"] = self._token
        return headers

    # ------------------------------------------------------------------ #
    # MCP SDK path (async, runs on shared background loop)                 #
    # ------------------------------------------------------------------ #

    async def _sdk_call(self, tool_name: str, args: dict) -> Any:
        from mcp import ClientSession                                   # noqa: PLC0415
        from mcp.client.streamable_http import streamablehttp_client   # noqa: PLC0415

        async with streamablehttp_client(
            self._url, headers=self._mcp_headers()
        ) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool(tool_name, args)
                return _extract_text(result)

    # ------------------------------------------------------------------ #
    # httpx / JSON-RPC fallback                                            #
    # ------------------------------------------------------------------ #

    def _jsonrpc(self, method: str, params: dict) -> dict:
        headers = {
            "Content-Type": "application/json",
            "Accept":       "application/json, text/event-stream",
        }
        if self._token:
            headers["Authorization"] = self._token

        payload = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
        resp = httpx.post(self._url, json=payload, headers=headers, timeout=20)
        resp.raise_for_status()

        ct = resp.headers.get("content-type", "")
        if "text/event-stream" in ct:
            return self._parse_sse(resp.text)

        data = resp.json()
        if "error" in data:
            raise RuntimeError(f"MCP error: {data['error']}")
        return data.get("result", {})

    @staticmethod
    def _parse_sse(text: str) -> dict:
        """Extract the first JSON payload from a text/event-stream response."""
        for line in text.splitlines():
            if line.startswith("data:"):
                raw = line[5:].strip()
                try:
                    data = json.loads(raw)
                    if "error" in data:
                        raise RuntimeError(f"MCP error: {data['error']}")
                    return data.get("result", {})
                except json.JSONDecodeError:
                    continue
        return {}

    # ------------------------------------------------------------------ #
    # Unified tool call: build nested args, try SDK then httpx            #
    # ------------------------------------------------------------------ #

    def _call(self, tool_name: str,
              params: dict | None = None,
              path_params: dict | None = None) -> Any:
        """
        Build the Zoho Commerce MCP nested argument structure:
          { "parameters": {...}, "path_parameters": {...} }
        and dispatch to SDK or httpx.
        """
        args: dict = {}
        if params:
            args["parameters"] = {**params, "organization_id": self._org_id}
        else:
            args["parameters"] = {"organization_id": self._org_id}
        if path_params:
            args["path_parameters"] = path_params

        if self._sdk_available:
            try:
                result = _run_async(self._sdk_call(tool_name, args))
                # SDK wraps JSON-RPC result; extract the content text
                if isinstance(result, dict) and "content" in result:
                    content = result["content"]
                    if isinstance(content, list) and content:
                        text = content[0].get("text", "{}")
                        try:
                            return json.loads(text)
                        except json.JSONDecodeError:
                            return text
                return result
            except Exception as exc:
                log.warning("SDK call_tool(%s) failed (%s); retrying via httpx.", tool_name, exc)

        # httpx fallback — result is already parsed JSON from tools/call
        result = self._jsonrpc("tools/call", {"name": tool_name, "arguments": args})
        # tools/call result contains {content: [{type, text}]}
        if isinstance(result, dict) and "content" in result:
            content = result["content"]
            if isinstance(content, list) and content:
                text = content[0].get("text", "{}")
                try:
                    return json.loads(text)
                except json.JSONDecodeError:
                    return text
        return result

    # ------------------------------------------------------------------ #
    # Bulk data fetchers (cached per-request is acceptable for PoC)       #
    # ------------------------------------------------------------------ #

    def _fetch_all_products(self) -> list[dict]:
        """Fetch the full product catalogue. Returns list of product dicts."""
        try:
            resp = self._call("list_all_products")
            if isinstance(resp, dict):
                return resp.get("products", [])
        except Exception:
            log.warning("list_all_products failed", exc_info=True)
        return []

    def _cache_get(self, slot: str):
        cached = getattr(self, f"_{slot}_cache", None)
        if cached and cached[1] > time.time():
            return cached[0]
        return None

    def _cache_set(self, slot: str, value) -> None:
        setattr(self, f"_{slot}_cache", (value, time.time() + self._CACHE_TTL_SECONDS))

    def _fetch_sales_index(self) -> dict[str, int]:
        """
        Map of product_id → units sold in the last 30 days.

        Strategy:
          1. Try get_sales_by_products_report (one call). Works when the org
             has the report flow enabled and grouped by product.
          2. Fallback: enumerate sales orders via list_sales_orders and pull
             line items via get_sales_order, aggregating by product_id. Works
             reliably whenever the org has any order history.

        Result is cached per RealMCPClient instance for CACHE_TTL_SECONDS.
        """
        cached = self._cache_get("sales")
        if cached is not None:
            return cached

        today = datetime.now().strftime("%Y-%m-%d")
        ago30 = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

        # --- Path 1: bulk report (Zoho Commerce sales-by-products) ---
        # Param shape matches the working storefront REST call:
        #   filter_by=Date.CustomDate  (NOT TransactionDate.CustomDate)
        #   group_by=products          (plain string, not a JSON array)
        #   sales_channel=zstore       (required to scope to the storefront)
        #   response_option=1          (detailed rows)
        #
        # The response has a FLAT `results` array — each entry is one product
        # with id=variant_id, count=units_sold, amount=revenue. (No nested
        # product_sales wrapper despite what the tool schema suggests.)
        try:
            resp = self._call("get_sales_by_products_report", params={
                "filter_by":       "Date.CustomDate",
                "from_date":       ago30,
                "to_date":         today,
                "group_by":        "products",
                "sales_channel":   "zstore",
                "response_option": 1,
                "per_page":        500,
            })
            index: dict[str, int] = {}
            for item in (resp.get("results") or []):
                if not isinstance(item, dict):
                    continue
                # id is the variant_id; product_id is sometimes also present
                key_v = str(item.get("id") or "")
                key_p = str(item.get("product_id") or "")
                qty   = _coerce_int(item.get("count") or item.get("quantity_sold") or item.get("quantity"))
                if not qty:
                    continue
                # Index by BOTH keys so lookups by either product_id or
                # variant_id resolve to the same number.
                if key_v: index[key_v] = index.get(key_v, 0) + qty
                if key_p: index[key_p] = index.get(key_p, 0) + qty
            if index:
                log.info("Sales index from report: %d entries (variant+product keyed)", len(index))
                self._cache_set("sales", index)
                return index
        except Exception:
            log.debug("get_sales_by_products_report unavailable", exc_info=True)

        # --- Path 2: aggregate sales orders (fallback if report fails) ---
        index = self._aggregate_sales_from_orders(since=ago30)
        log.info("Sales index from orders fallback: %d products", len(index))
        self._cache_set("sales", index)
        return index

    def _aggregate_sales_from_orders(self, since: str, max_orders: int = 100) -> dict[str, int]:
        """
        Enumerate sales orders and aggregate per-product quantities.

        Caps the order detail fetches at max_orders to keep latency bounded
        on stores with very long order history. For a hackathon demo with
        a small test catalog this fetches all of them.
        """
        try:
            resp = self._call("list_sales_orders", params={"per_page": max_orders})
            orders = (resp or {}).get("salesorders") or []
        except Exception:
            log.debug("list_sales_orders unavailable", exc_info=True)
            return {}

        # Filter to last 30 days when the order date is parseable
        try:
            cutoff = datetime.strptime(since, "%Y-%m-%d")
        except ValueError:
            cutoff = None

        eligible_ids: list[str] = []
        for o in orders:
            sid = o.get("salesorder_id")
            if not sid:
                continue
            if cutoff is not None:
                d = o.get("date") or ""
                try:
                    if datetime.strptime(d[:10], "%Y-%m-%d") < cutoff:
                        continue
                except ValueError:
                    pass
            eligible_ids.append(str(sid))

        index: dict[str, int] = {}
        for sid in eligible_ids[:max_orders]:
            try:
                od = self._call("get_sales_order", path_params={"salesorder_id": sid})
                so = (od or {}).get("salesorder") or od or {}
                for line in (so.get("line_items") or []):
                    pid = str(line.get("product_id") or "")
                    qty = _coerce_int(line.get("quantity"))
                    if pid and qty:
                        index[pid] = index.get(pid, 0) + qty
            except Exception:
                log.debug("get_sales_order failed for %s", sid, exc_info=True)
        return index

    def _fetch_return_index(self) -> dict[str, int]:
        """Map product_id → return count. Cached."""
        cached = self._cache_get("returns")
        if cached is not None:
            return cached
        index: dict[str, int] = {}
        try:
            resp = self._call("list_all_sales_returns")
            returns = resp.get("salesreturns", []) if isinstance(resp, dict) else []
            for r in returns:
                for line in (r.get("line_items") or [r]):
                    pid = str(
                        line.get("product_id") or
                        line.get("item_id") or
                        line.get("variant_id") or ""
                    )
                    if pid:
                        index[pid] = index.get(pid, 0) + 1
        except Exception:
            log.debug("list_all_sales_returns unavailable", exc_info=True)
        self._cache_set("returns", index)
        return index

    def _fetch_coupons(self) -> list[dict]:
        """List of active coupons. Cached."""
        cached = self._cache_get("coupons")
        if cached is not None:
            return cached
        coupons: list[dict] = []
        try:
            resp = self._call("list_coupons")
            if isinstance(resp, dict):
                coupons = resp.get("coupons", []) or []
        except Exception:
            log.debug("list_coupons unavailable", exc_info=True)
        self._cache_set("coupons", coupons)
        return coupons

    def get_catalog(self) -> list[dict]:
        """Slim records for all products — used by the alternative-product finder."""
        all_products = self._fetch_all_products()
        catalog = []
        for p in all_products:
            pid = str(p.get("product_id") or "")
            if not pid:
                continue
            variants = p.get("variants") or []
            rate = _coerce_float(
                (variants[0].get("rate") if variants else None) or p.get("min_rate")
            )
            catalog.append({
                "item_id":         pid,
                "item_name":       str(p.get("name") or "").strip(),
                "rate":            rate,
                "item_categories": str(p.get("category_name") or "Uncategorized"),
            })
        return catalog

    # ------------------------------------------------------------------ #
    # Public interface (matches MockMCPClient)                             #
    # ------------------------------------------------------------------ #

    def get_product_summary(self, product_ids: list[str]) -> list[dict]:
        """
        Slim records for /canshowComparison triage.
        Single call to list_all_products, then filter to requested ids.
        """
        id_set = set(product_ids)
        all_products = self._fetch_all_products()

        summaries: list[dict] = []
        for p in all_products:
            if not isinstance(p, dict):
                continue
            pid = str(p.get("product_id") or p.get("item_id") or "")
            if pid not in id_set:
                continue
            # Take stock and rate from the first variant if present
            variants = p.get("variants") or []
            v = variants[0] if variants else {}
            rate  = _coerce_float(v.get("rate") or p.get("min_rate"))
            stock = _coerce_int(v.get("available_stock") or v.get("stock_on_hand") or p.get("overall_stock"))
            summaries.append({
                "item_id":         pid,
                "item_name":       str(p.get("name") or p.get("item_name") or "").strip(),
                "item_categories": str(p.get("category_name") or "Uncategorized"),
                "rate":            rate,
                "units_sold_30d":  0,   # sales report may be empty for test store
                "available_stock": stock,
            })

        if summaries:
            return summaries

        # Fallback: per-product get_a_product calls if list_all_products didn't match
        log.info("list_all_products didn't match ids — trying per-product calls")
        for pid in product_ids:
            try:
                resp = self._call("get_a_product", path_params={"product_id": pid})
                p    = resp.get("product", resp) if isinstance(resp, dict) else {}
                if not p or not p.get("product_id"):
                    continue
                variants = p.get("variants") or []
                v    = variants[0] if variants else {}
                rate  = _coerce_float(v.get("rate") or p.get("min_rate"))
                stock = _coerce_int(v.get("available_stock") or v.get("stock_on_hand") or p.get("overall_stock"))
                summaries.append({
                    "item_id":         str(p.get("product_id") or ""),
                    "item_name":       str(p.get("name") or "").strip(),
                    "item_categories": str(p.get("category_name") or "Uncategorized"),
                    "rate":            rate,
                    "units_sold_30d":  0,
                    "available_stock": stock,
                })
            except Exception:
                log.warning("get_product_summary: could not fetch %s", pid, exc_info=True)
        return summaries

    def get_product_full(self, product_id: str) -> dict | None:
        """Full fused record for /compare."""
        try:
            resp = self._call("get_a_product", path_params={"product_id": product_id})
            product = resp.get("product", resp) if isinstance(resp, dict) else {}
            if not product or not product.get("product_id"):
                log.warning("get_product_full: empty/invalid response for %s", product_id)
                return None
        except Exception:
            log.warning("get_product_full: get_a_product failed for %s", product_id, exc_info=True)
            return None

        variants = product.get("variants") or []
        variant  = variants[0] if variants else {}
        variant_id = str(variant.get("variant_id") or "")

        # Bulk enrichment data
        sales_index   = self._fetch_sales_index()
        return_index  = self._fetch_return_index()
        coupons       = self._fetch_coupons()

        # Look up return count for this product (try both product_id and variant_id)
        return_count = (
            return_index.get(product_id) or
            return_index.get(variant_id) or 0
        )

        return _map_product(product, variant, sales_index, return_count, coupons)
