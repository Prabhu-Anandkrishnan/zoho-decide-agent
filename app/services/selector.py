"""Triage logic for POST /canshowComparison.

LLM-driven: builds a privacy-bucketed summary of every product the shopper
has viewed, asks Claude Haiku to pick the best pair for a side-by-side
comparison, and validates the result. Falls back to a deterministic
scoring rule if the LLM fails or returns nonsense — so the demo never
hard-fails.
"""
import json
import logging
import re
from collections import defaultdict
from typing import Iterable, Protocol

from app.llm.prompts import SELECTOR_PROMPT
from app.mcp.client import MCPClient
from app.models import CanShowComparisonResponse, SelectedProduct
from app.privacy.buckets import bucket_popularity, bucket_stock

log = logging.getLogger(__name__)


class LLM(Protocol):
    def complete_json(self, system: str, user_payload: str, max_tokens: int = 1024) -> str: ...


_JSON_BLOCK_RE = re.compile(r"\{.*\}", re.DOTALL)


# ---------------------------------------------------------------------------
# LLM input builder
# ---------------------------------------------------------------------------

def _build_llm_payload(summaries: list[dict]) -> str:
    """Compact, bucketed product list — never includes raw sales/stock numbers."""
    items = []
    for s in summaries:
        items.append({
            "product_id":   s["item_id"],
            "name":         s["item_name"],
            "category":     s["item_categories"],
            "price":        s["rate"],
            "popularity":   bucket_popularity(int(s.get("units_sold_30d") or 0)),
            "stock_status": bucket_stock(int(s.get("available_stock") or 0)),
        })
    return json.dumps({"viewed_products": items}, indent=2)


def _parse_llm_json(raw: str) -> dict | None:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        m = _JSON_BLOCK_RE.search(raw)
        if not m:
            return None
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            return None


# ---------------------------------------------------------------------------
# Deterministic fallback (used when LLM call fails or returns invalid IDs)
# ---------------------------------------------------------------------------

def _group_by_category(summaries: list[dict]) -> dict[str, list[dict]]:
    groups: dict[str, list[dict]] = defaultdict(list)
    for s in summaries:
        groups[s["item_categories"]].append(s)
    return groups


def _pick_winning_category(groups: dict[str, list[dict]]) -> list[dict] | None:
    candidates = [g for g in groups.values() if len(g) >= 2]
    if not candidates:
        return None
    return max(candidates, key=lambda g: sum(p.get("units_sold_30d", 0) for p in g))


def _score_upsell(candidate: dict, baseline: dict) -> int:
    score = 0
    if candidate["rate"] > baseline["rate"] * 1.15:
        score += 3
    if candidate.get("units_sold_30d", 0) > baseline.get("units_sold_30d", 0):
        score += 2
    stock = bucket_stock(int(candidate.get("available_stock") or 0))
    if stock == "in_stock":     score += 1
    if stock == "out_of_stock": score -= 2
    return score


def _heuristic_pair(summaries: list[dict]) -> tuple[dict, dict] | None:
    if len(summaries) < 2:
        return None
    order_index = {s["item_id"]: i for i, s in enumerate(summaries)}
    winning = _pick_winning_category(_group_by_category(summaries))
    if not winning:
        return None
    baseline = min(winning, key=lambda p: order_index[p["item_id"]])
    siblings = [s for s in winning if s["item_id"] != baseline["item_id"]]
    if not siblings:
        return None
    upsell = max(
        siblings,
        key=lambda c: (_score_upsell(c, baseline), c.get("units_sold_30d", 0), c["rate"]),
    )
    return baseline, upsell


# ---------------------------------------------------------------------------
# LLM-driven selection
# ---------------------------------------------------------------------------

def _llm_select(summaries: list[dict], llm: LLM) -> tuple[str, str] | None:
    """Returns (id_a, id_b) chosen by the LLM, or None on failure."""
    valid_ids = {s["item_id"] for s in summaries}
    payload   = _build_llm_payload(summaries)

    try:
        raw    = llm.complete_json(system=SELECTOR_PROMPT, user_payload=payload, max_tokens=256)
        parsed = _parse_llm_json(raw)
    except Exception:
        log.warning("Selector LLM call failed", exc_info=True)
        return None

    if not parsed:
        log.warning("Selector LLM returned non-JSON: %r", raw[:200])
        return None

    ids = parsed.get("selectedProductIds") or []
    if not isinstance(ids, list) or len(ids) != 2:
        log.info("Selector LLM returned no/wrong pair: %r", parsed)
        return None

    id_a, id_b = str(ids[0]), str(ids[1])
    if id_a == id_b or id_a not in valid_ids or id_b not in valid_ids:
        log.warning("Selector LLM returned invalid IDs: %s, %s", id_a, id_b)
        return None

    log.info("Selector LLM picked %s + %s — reason: %s", id_a, id_b, parsed.get("reasoning", ""))
    return id_a, id_b


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def decide(
    product_ids: Iterable[str],
    client: MCPClient,
    llm: LLM | None = None,
) -> CanShowComparisonResponse:
    summaries = client.get_product_summary(list(product_ids))
    if len(summaries) < 2:
        return CanShowComparisonResponse(showPopup=False, selectedProductIds=[])

    by_id = {s["item_id"]: s for s in summaries}

    # ── Primary path: LLM picks the pair ────────────────────────────────
    pair_ids: tuple[str, str] | None = None
    if llm is not None:
        pair_ids = _llm_select(summaries, llm)

    # ── Fallback: deterministic scoring ─────────────────────────────────
    if pair_ids is None:
        heuristic = _heuristic_pair(summaries)
        if heuristic is None:
            return CanShowComparisonResponse(showPopup=False, selectedProductIds=[])
        pair_ids = (heuristic[0]["item_id"], heuristic[1]["item_id"])

    a, b = by_id[pair_ids[0]], by_id[pair_ids[1]]
    return CanShowComparisonResponse(
        showPopup=True,
        selectedProductIds=[a["item_id"], b["item_id"]],
        selectedProducts=[
            SelectedProduct(id=a["item_id"], name=a["item_name"]),
            SelectedProduct(id=b["item_id"], name=b["item_name"]),
        ],
    )
