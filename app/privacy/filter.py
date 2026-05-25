"""Transform raw fused MCP records into privacy-safe SafeProduct objects.

The LLM and the user-facing response may ONLY see SafeProduct. Anything
that could leak a backend metric (cost, raw stock, raw sales/return counts,
coupon codes, supplier ids) is dropped or replaced with a qualitative label.
"""
from typing import Any

from app.models import SafeProduct
from app.privacy.buckets import bucket_popularity, bucket_reliability, bucket_stock


# Field names that must never appear in SafeProduct or downstream output.
FORBIDDEN_KEYS: frozenset[str] = frozenset({
    "purchase_rate", "cost_price", "purchase_account_id", "inventory_account_id",
    "margin", "supplier_id", "supplier_name", "warehouse_address",
    "stock_on_hand", "available_stock", "reserved_stock", "damaged_stock",
    "reorder_level", "quantity_on_order",
    "units_sold", "units_sold_30d", "units_sold_7d",
    "quantity_returned", "quantity_returned_30d", "return_rate", "return_count",
    "coupon_code", "discount_value",
})


def _clean_attributes(raw: dict[str, Any] | None) -> dict[str, Any]:
    if not raw:
        return {}
    return {k: v for k, v in raw.items() if k not in FORBIDDEN_KEYS}


def _discount_label(promo: dict[str, Any] | None) -> str | None:
    """Convert promo into a user-facing label without leaking the coupon code."""
    if not promo:
        return None
    by = promo.get("discount_by")
    val = promo.get("discount_value")
    if val is None:
        return None
    if by == "percentage":
        return f"{int(val)}% off"
    if by in ("fixed_amount", "fixed"):
        return f"${val:.2f} off"
    return "Discount available"


def to_safe_product(raw: dict[str, Any]) -> SafeProduct:
    """Project a fused MCP record into the LLM-visible SafeProduct view."""
    inventory = raw.get("inventory") or {}
    sales = raw.get("sales") or {}
    returns = raw.get("returns") or {}
    promotions = raw.get("promotions")

    return SafeProduct(
        product_id=str(raw["item_id"]),
        name=raw["item_name"],
        description=raw.get("description", ""),
        selling_price=float(raw["rate"]),
        list_price=float(raw["mrp"]) if raw.get("mrp") is not None else None,
        category=raw.get("item_categories", "Uncategorized"),
        attributes=_clean_attributes(raw.get("attributes")),
        stock_status=bucket_stock(int(inventory.get("available_stock", 0))),
        popularity=bucket_popularity(int(sales.get("units_sold_30d", 0))),
        reliability_signal=bucket_reliability(float(returns.get("return_rate", 0.0))),
        current_discount=_discount_label(promotions),
    )
