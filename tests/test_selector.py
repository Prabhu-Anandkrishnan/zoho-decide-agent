"""Tests for the deterministic /canshowComparison selector."""
from app.mcp.mock_client import MockMCPClient
from app.services.selector import decide

# Commerce MCP product IDs (org 49826422)
NEO = "9000000008012"
MBA13 = "9000000008048"
MBA15 = "9000000008063"
ROG = "9000000008164"
MBP16 = "9000000008093"


def test_same_category_returns_popup_true() -> None:
    client = MockMCPClient()
    res = decide([MBA13, NEO, ROG], client)
    assert res.showPopup is True
    assert len(res.selectedProductIds) == 2
    assert MBA13 in res.selectedProductIds  # baseline preserves browse order


def test_unknown_ids_returns_false() -> None:
    client = MockMCPClient()
    res = decide(["item_999", "item_888"], client)
    assert res.showPopup is False
    assert res.selectedProductIds == []


def test_single_product_returns_false() -> None:
    client = MockMCPClient()
    res = decide([MBA13], client)
    assert res.showPopup is False


def test_upsell_outranks_cheaper_sibling() -> None:
    """Given a cheap baseline + mid-tier + premium siblings, picks an upsell."""
    client = MockMCPClient()
    # NEO = $699 baseline, MBA13 = $1099 mid-tier, MBP16 = $2799 premium
    res = decide([NEO, MBA13, MBP16], client)
    assert res.showPopup is True
    assert res.selectedProductIds[0] == NEO  # baseline = first viewed
    assert res.selectedProductIds[1] in {MBA13, MBP16}


def test_out_of_stock_is_skipped_as_upsell() -> None:
    """Out-of-stock siblings must not be picked as the upsell."""
    class OosClient(MockMCPClient):
        def get_product_summary(self, product_ids: list[str]) -> list[dict]:
            summaries = super().get_product_summary(product_ids)
            for s in summaries:
                if s["item_id"] == MBA13:
                    s["available_stock"] = 0
            return summaries

    res = decide([NEO, MBA13, ROG], OosClient())
    assert res.showPopup is True
    assert MBA13 not in res.selectedProductIds
