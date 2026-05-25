"""Deep-comparison orchestration for POST /compare.

Flow for a first-time call:
  MCP fetch → privacy filter → LLM (Haiku) → JSON validation

Flow for a follow-up (user_input present):
  1. Classify intent: "detail" | "alternative"
  2a. detail:      re-run comparison focused on the preference
  2b. alternative: find best-match product from catalog, swap the weaker
                   product, run fresh comparison on the new pair

Falls back to a deterministic heuristic if the LLM returns malformed JSON.
"""
import json
import logging
import re
from typing import Protocol

from fastapi import HTTPException

from app.llm.prompts import CLASSIFY_PROMPT, SYSTEM_PROMPT
from app.mcp.client import MCPClient
from app.models import (
    ChatTurn,
    CompareResponse,
    ComparisonPoint,
    SafeProduct,
    SelectedProduct,
)
from app.privacy.filter import to_safe_product

log = logging.getLogger(__name__)


class LLM(Protocol):
    def complete_json(self, system: str, user_payload: str, max_tokens: int = 1024) -> str: ...


_JSON_BLOCK_RE = re.compile(r"\{.*\}", re.DOTALL)

# Popularity rank used for tie-breaking "which original product to keep"
_POP_RANK = {"low": 0, "medium": 1, "high": 2, "bestseller": 3}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _safe_products(product_ids: list[str], client: MCPClient) -> tuple[SafeProduct, SafeProduct]:
    raws = [(pid, client.get_product_full(pid)) for pid in product_ids]
    missing = [pid for pid, r in raws if r is None]
    if missing:
        raise HTTPException(status_code=404, detail=f"Unknown product_ids: {missing}")
    return to_safe_product(raws[0][1]), to_safe_product(raws[1][1])


def _format_history(history: list[ChatTurn] | None, limit: int = 6) -> str:
    """Render the last few chat turns as a plain text block for prompts."""
    if not history:
        return "(no prior messages)"
    recent = history[-limit:]
    lines = []
    for turn in recent:
        role = "User" if turn.role == "user" else "AI"
        text = (turn.text or "").strip().replace("\n", " ")
        if text:
            lines.append(f"  {role}: {text}")
    return "\n".join(lines) if lines else "(no prior messages)"


def _focus_name(focus_id: str | None, safe_a: SafeProduct, safe_b: SafeProduct) -> str:
    """Resolve the focus product_id to a name, defaulting to product_a."""
    if focus_id == safe_a.product_id: return safe_a.name
    if focus_id == safe_b.product_id: return safe_b.name
    # Default focus = the product the AI most recently emphasised — start with a
    return safe_a.name


def _build_user_payload(
    safe_a: SafeProduct,
    safe_b: SafeProduct,
    user_input: str | None = None,
    focus_product_id: str | None = None,
    chat_history: list[ChatTurn] | None = None,
) -> str:
    payload: dict = {"product_a": safe_a.model_dump(), "product_b": safe_b.model_dump()}
    if user_input and user_input.strip():
        payload["user_preference"] = user_input.strip()
    if focus_product_id:
        payload["focus_product_id"] = focus_product_id
    if chat_history:
        payload["chat_history"] = [
            {"role": t.role, "text": t.text} for t in chat_history[-6:]
        ]
    return json.dumps(payload, indent=2)


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


def _heuristic_fallback(
    safe_a: SafeProduct,
    safe_b: SafeProduct,
    user_input: str | None = None,
) -> CompareResponse:
    points = [
        ComparisonPoint(
            feature="Price",
            product_a=f"${safe_a.selling_price:.2f}",
            product_b=f"${safe_b.selling_price:.2f}",
            winner=safe_a.product_id if safe_a.selling_price < safe_b.selling_price else safe_b.product_id,
        ),
        ComparisonPoint(
            feature="Availability",
            product_a=safe_a.stock_status.replace("_", " ").title(),
            product_b=safe_b.stock_status.replace("_", " ").title(),
            winner=None,
        ),
    ]
    rel_rank = {"concerning": 0, "average": 1, "good": 2}
    score_a = _POP_RANK[safe_a.popularity] + rel_rank[safe_a.reliability_signal]
    score_b = _POP_RANK[safe_b.popularity] + rel_rank[safe_b.reliability_signal]
    winner = safe_a if score_a >= score_b else safe_b
    other  = safe_b if winner is safe_a else safe_a

    suggestion: str | None = None
    if user_input and user_input.strip():
        pref = user_input.strip()[:60]
        suggestion = (
            f"Based on your preference for '{pref}', "
            f"{winner.name} appears to be the better fit. "
            f"Are you OK with this choice?"
        )

    # Confidence: 75 baseline; bump it if there's a clear quality gap, dampen for ties.
    confidence = 75 + min(15, (score_a - score_b if winner is safe_a else score_b - score_a) * 3)

    return CompareResponse(
        comparisonPoints=points,
        recommendedProductId=winner.product_id,
        recommendationReasoning=(
            f"The {winner.name} stands out on the public specs that matter most "
            f"for everyday use compared to the {other.name}."
        ),
        suggestionText=suggestion,
        confidence=int(max(60, min(95, confidence))),
    )


# ---------------------------------------------------------------------------
# Core comparison (no intent classification — always compares the given pair)
# ---------------------------------------------------------------------------

def _run_comparison(
    product_ids: list[str],
    client: MCPClient,
    llm: LLM,
    user_input: str | None = None,
    focus_product_id: str | None = None,
    chat_history: list[ChatTurn] | None = None,
) -> CompareResponse:
    safe_a, safe_b = _safe_products(product_ids, client)
    user_payload   = _build_user_payload(
        safe_a, safe_b, user_input,
        focus_product_id=focus_product_id, chat_history=chat_history,
    )

    try:
        raw    = llm.complete_json(system=SYSTEM_PROMPT, user_payload=user_payload)
        parsed = _parse_llm_json(raw)
        if parsed is None:
            raise ValueError("LLM returned non-JSON")
        response = CompareResponse.model_validate(parsed)
        if response.recommendedProductId not in {safe_a.product_id, safe_b.product_id}:
            raise ValueError("recommendedProductId not in input set")
        return response
    except Exception as exc:
        log.warning("LLM comparison failed, using heuristic fallback: %s", exc)
        return _heuristic_fallback(safe_a, safe_b, user_input)


# ---------------------------------------------------------------------------
# Intent classification + alternative-product selection
# ---------------------------------------------------------------------------

def _classify_intent(
    user_input: str,
    llm: LLM,
    product_a_name: str,
    product_b_name: str,
    focus_name: str,
    chat_history: list[ChatTurn] | None,
) -> str:
    """Returns 'alternative' or 'detail'. Uses focus + history for accuracy."""
    prompt = CLASSIFY_PROMPT.format(
        message=user_input.strip()[:400],
        product_a_name=product_a_name,
        product_b_name=product_b_name,
        focus_name=focus_name or product_a_name,
        history=_format_history(chat_history),
    )
    try:
        raw = llm.complete_json(
            system="You classify shopper intent. Reply with a single word only.",
            user_payload=prompt,
            max_tokens=10,
        )
        return "alternative" if "alternative" in raw.lower() else "detail"
    except Exception:
        log.debug("Intent classification failed; defaulting to detail")
        return "detail"


def _find_alternative(
    user_input: str,
    current_ids: list[str],
    catalog: list[dict],
    llm: LLM,
) -> str | None:
    """
    Ask the LLM to pick the best-matching product from the catalog
    (excluding the two already in the comparison).
    Returns a product_id or None.
    """
    available = [p for p in catalog if p["item_id"] not in current_ids]
    if not available:
        log.info("No alternatives available outside current pair")
        return None

    lines = "\n".join(
        f"- ID: {p['item_id']} | {p['item_name']} | ${p['rate']:.2f} | {p['item_categories']}"
        for p in available
    )
    prompt = (
        f"A shopper said: \"{user_input.strip()[:300]}\"\n\n"
        f"Available products:\n{lines}\n\n"
        "Which one product ID from the list best matches the shopper's preference?\n"
        "Reply with the product ID only, nothing else."
    )

    try:
        raw = llm.complete_json(
            system="You are a product selector. Reply with a single product ID only.",
            user_payload=prompt,
            max_tokens=30,
        )
        raw = raw.strip()
        for p in available:
            if p["item_id"] in raw:
                return p["item_id"]
        # Fallback: first available
        return available[0]["item_id"]
    except Exception:
        log.warning("Alternative-product selection failed", exc_info=True)
        return available[0]["item_id"] if available else None


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def compare(
    product_ids: list[str],
    client: MCPClient,
    llm: LLM,
    user_input: str | None = None,
    focus_product_id: str | None = None,
    chat_history: list[ChatTurn] | None = None,
) -> CompareResponse:

    # ── No follow-up: plain comparison ──────────────────────────────────
    if not user_input or not user_input.strip():
        return _run_comparison(product_ids, client, llm)

    # ── Classify the follow-up intent (with focus + history context) ────
    safe_a, safe_b = _safe_products(product_ids, client)
    focus_name = _focus_name(focus_product_id, safe_a, safe_b)

    intent = _classify_intent(
        user_input, llm,
        product_a_name=safe_a.name,
        product_b_name=safe_b.name,
        focus_name=focus_name,
        chat_history=chat_history,
    )
    log.info(
        "Intent='%s' | focus=%r | msg=%r",
        intent, focus_name, user_input[:80],
    )

    # ── ALTERNATIVE: find a replacement product, re-run comparison ──────
    if intent == "alternative":
        catalog = client.get_catalog()

        # Keep the stronger of the original two products.
        keep_id = (
            safe_a.product_id
            if _POP_RANK[safe_a.popularity] >= _POP_RANK[safe_b.popularity]
            else safe_b.product_id
        )

        alt_id = _find_alternative(user_input, product_ids, catalog, llm)

        if alt_id and alt_id != keep_id:
            new_ids = [keep_id, alt_id]
            # Focus shifts to the alternative; history is preserved.
            result = _run_comparison(
                new_ids, client, llm, user_input,
                focus_product_id=alt_id, chat_history=chat_history,
            )
            result.intent = "alternative"

            by_id = {p["item_id"]: p["item_name"] for p in catalog}
            result.alternativeProducts = [
                SelectedProduct(id=keep_id, name=by_id.get(keep_id, keep_id)),
                SelectedProduct(id=alt_id,  name=by_id.get(alt_id, alt_id)),
            ]
            return result

        log.info("No suitable alternative found; treating as detail")

    # ── DETAIL: re-run comparison with user preference + focus + history ─
    result = _run_comparison(
        product_ids, client, llm, user_input,
        focus_product_id=focus_product_id, chat_history=chat_history,
    )
    result.intent = "detail"
    return result
