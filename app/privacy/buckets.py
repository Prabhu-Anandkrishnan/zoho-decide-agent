"""Thresholds that convert raw backend numbers into qualitative buckets.

Tune these here without touching the LLM, the MCP layer, or the response
builder — the buckets are the privacy contract between raw data and prompt.
"""
from typing import Literal


StockStatus = Literal["in_stock", "low_stock", "out_of_stock"]
Popularity = Literal["low", "medium", "high", "bestseller"]
Reliability = Literal["good", "average", "concerning"]


def bucket_stock(available_stock: int) -> StockStatus:
    if available_stock > 10:
        return "in_stock"
    if available_stock > 1:
        return "low_stock"
    return "out_of_stock"


def bucket_popularity(units_sold_30d: int) -> Popularity:
    if units_sold_30d > 200:
        return "bestseller"
    if units_sold_30d > 50:
        return "high"
    if units_sold_30d > 10:
        return "medium"
    return "low"


def bucket_reliability(return_rate: float) -> Reliability:
    if return_rate >= 0.15:
        return "concerning"
    if return_rate >= 0.05:
        return "average"
    return "good"
