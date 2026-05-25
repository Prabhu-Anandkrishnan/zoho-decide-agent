# Zoho Commerce — "Help me to decide" Backend PoC

Hackathon backend that powers a storefront popup widget: it watches what
products a shopper has viewed, decides if a side-by-side comparison would
be useful, and produces an AI recommendation grounded in Zoho Commerce
data fetched via MCP.

## Endpoints

| Method | Path                   | Purpose                                                      |
|--------|------------------------|--------------------------------------------------------------|
| POST   | `/canshowComparison`   | Triage — should the popup fire, and which two products?      |
| POST   | `/compare`             | Deep comparison + AI recommendation between two products     |
| GET    | `/health`              | Liveness + active config                                     |

### POST `/canshowComparison`

```json
// request
{ "product_ids": ["item_101", "item_102", "item_103"] }

// response
{ "showPopup": true, "selectedProductIds": ["item_101", "item_103"] }
```

Deterministic, no LLM call. Picks the most-shopped same-category pair from
the viewed list, with the first-viewed product as baseline and a higher-value
sibling as the upsell.

### POST `/compare`

```json
// request
{ "product_ids": ["item_101", "item_103"] }

// response
{
  "comparisonPoints": [
    { "feature": "Price", "product_a": "$1199.00", "product_b": "$1899.00", "winner": "item_101" },
    { "feature": "Display", "product_a": "14-inch 2.8K OLED", "product_b": "16-inch 4K mini-LED", "winner": "item_103" }
  ],
  "recommendedProductId": "item_103",
  "recommendationReasoning": "The Cirrus Studio 16 brings a dedicated GPU and 32 GB of RAM..."
}
```

Calls Claude Haiku with a strict JSON contract. Falls back to a deterministic
heuristic if the LLM returns malformed JSON, so the demo never hard-fails.

## Privacy guardrails

Raw backend metrics never reach the LLM or the API response. They are
bucketed into qualitative signals before crossing the trust boundary:

| Raw MCP field            | What the LLM sees                              |
|--------------------------|-------------------------------------------------|
| `stock_on_hand: 6`       | `stock_status: "low_stock"`                     |
| `units_sold_30d: 215`    | `popularity: "bestseller"`                      |
| `return_rate: 0.18`      | `reliability_signal: "concerning"`              |
| `coupon_code: LAPTOP20`  | `current_discount: "20% off"`                   |
| `purchase_rate`, `margin`| removed                                          |

Thresholds live in [`app/privacy/buckets.py`](app/privacy/buckets.py); the
forbidden-keys allowlist sits in [`app/privacy/filter.py`](app/privacy/filter.py).
Tests assert that no forbidden token can appear in `/compare` output.

## Running locally

```bash
cd zoho-decide-agent
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=sk-ant-...
# ZOHO_MCP_MODE defaults to "mock", which uses an in-memory catalog.

uvicorn app.main:app --reload --port 8000
```

### Smoke test

```bash
curl -s localhost:8000/health | jq

curl -s -X POST localhost:8000/canshowComparison \
  -H 'content-type: application/json' \
  -d '{"product_ids":["item_101","item_102","item_103"]}' | jq

curl -s -X POST localhost:8000/compare \
  -H 'content-type: application/json' \
  -d '{"product_ids":["item_101","item_103"]}' | jq
```

### Tests

```bash
pytest -v
```

Test coverage:
- `tests/test_privacy.py` — no forbidden field can leak into `SafeProduct`
- `tests/test_selector.py` — same-category clustering, upsell scoring, OOS filtering
- `tests/test_compare_integration.py` — full HTTP flow with a stubbed LLM, including
  a privacy regression that greps the response for forbidden tokens

## Wiring the real MCP server

The factory at [`app/mcp/client.py`](app/mcp/client.py) switches between
mock and real based on `ZOHO_MCP_MODE`. To plug in the live Zoho Commerce
MCP endpoint (`prabhu-18800.csez.zohocorpin.com/mcp`):

1. Implement `RealMCPClient.get_product_summary` and `get_product_full` in
   [`app/mcp/real_client.py`](app/mcp/real_client.py), preserving the
   field names the mock returns (`item_id`, `item_name`, `item_categories`,
   `rate`, `mrp`, `attributes`, `inventory`, `sales`, `returns`, `promotions`).
2. Set `ZOHO_MCP_MODE=real`, `ZOHO_MCP_URL`, `ZOHO_MCP_TOKEN` in `.env`.
3. Restart. No other code changes needed — the privacy filter, selector,
   and comparator are unaware of which backend is in play.

## Project layout

```
zoho-decide-agent/
├── app/
│   ├── main.py                FastAPI app + CORS + /health
│   ├── config.py              env-driven settings
│   ├── models.py              Pydantic request/response/SafeProduct schemas
│   ├── mcp/
│   │   ├── client.py          factory (mock|real)
│   │   ├── mock_client.py     in-memory Zoho-shaped fixtures
│   │   └── real_client.py     live MCP stub
│   ├── privacy/
│   │   ├── buckets.py         qualitative thresholds
│   │   └── filter.py          raw → SafeProduct projection
│   ├── services/
│   │   ├── selector.py        /canshowComparison logic
│   │   └── comparator.py      /compare orchestration + LLM fallback
│   ├── llm/
│   │   ├── claude.py          Anthropic SDK wrapper
│   │   └── prompts.py         SYSTEM_PROMPT with privacy contract
│   └── routes/
│       ├── triage.py          POST /canshowComparison
│       └── compare.py         POST /compare
└── tests/                     pytest suite
```
