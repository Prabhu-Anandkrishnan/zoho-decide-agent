"""Privacy guarantee: SafeProduct must never carry forbidden raw fields."""
import json

from app.mcp.mock_client import MockMCPClient
from app.privacy.filter import FORBIDDEN_KEYS, to_safe_product

MBA13 = "9000000008048"
MBA15 = "9000000008063"
MBP14 = "9000000008078"
SPECTRE = "9000000008129"


def test_no_forbidden_keys_in_any_safe_product() -> None:
    client = MockMCPClient()
    for pid in client.list_all_ids():
        raw = client.get_product_full(pid)
        safe = to_safe_product(raw)
        dumped = safe.model_dump()
        flat = json.dumps(dumped)
        for key in FORBIDDEN_KEYS:
            assert f'"{key}"' not in flat, f"forbidden key {key} leaked into {pid}"


def test_stock_buckets_for_known_cases() -> None:
    client = MockMCPClient()
    # MBA13 has available_stock=16 → in_stock
    assert to_safe_product(client.get_product_full(MBA13)).stock_status == "in_stock"
    # MBA15 has available_stock=80 → in_stock
    assert to_safe_product(client.get_product_full(MBA15)).stock_status == "in_stock"


def test_reliability_buckets_for_known_cases() -> None:
    client = MockMCPClient()
    # Spectre return_rate=0.16 → concerning
    assert to_safe_product(client.get_product_full(SPECTRE)).reliability_signal == "concerning"
    # MBP14 return_rate=0.083 → average
    assert to_safe_product(client.get_product_full(MBP14)).reliability_signal == "average"
    # MBA13 return_rate=0.018 → good
    assert to_safe_product(client.get_product_full(MBA13)).reliability_signal == "good"


def test_discount_label_does_not_leak_coupon_code() -> None:
    client = MockMCPClient()
    safe = to_safe_product(client.get_product_full(MBA13))
    assert safe.current_discount == "10% off"
    assert "APPLE10" not in (safe.current_discount or "")
