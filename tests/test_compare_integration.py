"""End-to-end test for /compare with a stubbed LLM.

Verifies the response shape AND that no forbidden token leaks into the
final user-facing JSON (privacy regression).
"""
import json

from fastapi.testclient import TestClient

from app.main import app
from app.mcp.client import get_mcp_client
from app.mcp.mock_client import MockMCPClient
from app.routes.compare import get_llm_client

MBA13 = "9000000008048"
ROG = "9000000008164"

CANNED_LLM_OUTPUT = json.dumps({
    "comparisonPoints": [
        {"feature": "Price", "product_a": "$1099.00", "product_b": "$1899.00", "winner": MBA13},
        {"feature": "Processor", "product_a": "Apple M3", "product_b": "AMD Ryzen AI", "winner": ROG},
        {"feature": "Use case", "product_a": "Everyday productivity", "product_b": "Gaming and creation", "winner": ROG},
    ],
    "recommendedProductId": ROG,
    "recommendationReasoning": (
        "The ASUS ROG Zephyrus G14 brings dedicated RTX graphics and Ryzen AI performance, "
        "which justify the higher price for gaming and creative workloads compared to the MacBook Air 13 M3."
    ),
})


class StubLLM:
    def __init__(self, payload: str = CANNED_LLM_OUTPUT) -> None:
        self.payload = payload
        self.last_user_payload: str | None = None

    def complete_json(self, system: str, user_payload: str, max_tokens: int = 1024) -> str:
        self.last_user_payload = user_payload
        return self.payload


def _client_with_stubs(llm_payload: str = CANNED_LLM_OUTPUT) -> tuple[TestClient, StubLLM]:
    stub = StubLLM(llm_payload)
    app.dependency_overrides[get_mcp_client] = lambda: MockMCPClient()
    app.dependency_overrides[get_llm_client] = lambda: stub
    return TestClient(app), stub


def teardown_function() -> None:
    app.dependency_overrides.clear()


def test_compare_returns_validated_response() -> None:
    client, _ = _client_with_stubs()
    r = client.post("/compare", json={"product_ids": [MBA13, ROG]})
    assert r.status_code == 200
    body = r.json()
    assert body["recommendedProductId"] == ROG
    assert len(body["comparisonPoints"]) >= 1
    assert body["recommendationReasoning"]


def test_compare_response_has_no_forbidden_tokens() -> None:
    """Privacy regression: response text must not contain raw backend tokens."""
    client, _ = _client_with_stubs()
    r = client.post("/compare", json={"product_ids": [MBA13, ROG]})
    text = r.text.lower()
    for token in ("return_rate", "stock_on_hand", "units_sold", "coupon_code",
                  "purchase_rate", "available_stock", "cost_price"):
        assert token not in text, f"forbidden token {token} leaked into /compare response"


def test_llm_payload_only_contains_safe_product_fields() -> None:
    """The user_payload sent to the LLM must not contain raw backend numbers."""
    client, stub = _client_with_stubs()
    client.post("/compare", json={"product_ids": [MBA13, ROG]})
    assert stub.last_user_payload is not None
    payload = stub.last_user_payload
    for token in ("stock_on_hand", "units_sold_30d", "return_rate",
                  "quantity_returned_30d", "coupon_code", "purchase_rate"):
        assert token not in payload, f"forbidden field {token} reached the LLM"


def test_compare_falls_back_when_llm_returns_garbage() -> None:
    client, _ = _client_with_stubs(llm_payload="not valid json at all")
    r = client.post("/compare", json={"product_ids": [MBA13, ROG]})
    assert r.status_code == 200
    body = r.json()
    # Heuristic fallback always picks one of the two inputs.
    assert body["recommendedProductId"] in {MBA13, ROG}
    assert body["comparisonPoints"]


def test_compare_rejects_duplicate_ids() -> None:
    client, _ = _client_with_stubs()
    r = client.post("/compare", json={"product_ids": [MBA13, MBA13]})
    assert r.status_code == 422


def test_compare_rejects_unknown_ids() -> None:
    client, _ = _client_with_stubs()
    r = client.post("/compare", json={"product_ids": [MBA13, "item_999"]})
    assert r.status_code == 404


def test_canshow_endpoint_smoke() -> None:
    client, _ = _client_with_stubs()
    r = client.post("/canshowComparison", json={"product_ids": [MBA13, "9000000008012", ROG]})
    assert r.status_code == 200
    body = r.json()
    assert body["showPopup"] is True
    assert len(body["selectedProductIds"]) == 2
