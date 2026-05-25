"""Pydantic schemas for requests, responses, and the privacy-safe product view."""
from typing import Any, Literal
from pydantic import BaseModel, Field, field_validator


# ---------- /canshowComparison ----------

class CanShowComparisonRequest(BaseModel):
    product_ids: list[str] = Field(..., min_length=1, description="IDs of products viewed in this session")


class SelectedProduct(BaseModel):
    """Minimal product info returned by /canshowComparison so the UI can show names."""
    id: str
    name: str


class CanShowComparisonResponse(BaseModel):
    showPopup: bool
    selectedProductIds: list[str]
    selectedProducts: list[SelectedProduct] = Field(
        default_factory=list,
        description="Same pair as selectedProductIds but with display names included.",
    )


# ---------- /compare ----------

class ChatTurn(BaseModel):
    """One turn of the refinement conversation, used to give the LLM context."""
    role: Literal["user", "ai"]
    text: str


class CompareRequest(BaseModel):
    product_ids: list[str] = Field(..., min_length=2, max_length=2)
    user_input: str | None = Field(
        default=None,
        description="Optional follow-up preference typed by the shopper in the chat box.",
    )
    # ── Conversational context (sent on follow-up turns only) ─────────────
    focus_product_id: str | None = Field(
        default=None,
        description=(
            "The product currently being discussed in the chat. Usually the most "
            "recent AI recommendation. Lets the LLM resolve pronouns like 'it' / "
            "'that one' to the right product."
        ),
    )
    chat_history: list[ChatTurn] = Field(
        default_factory=list,
        description="Last few user/AI turns this session, oldest first.",
    )

    @field_validator("product_ids")
    @classmethod
    def _distinct(cls, v: list[str]) -> list[str]:
        if len(set(v)) != 2:
            raise ValueError("product_ids must contain two distinct ids")
        return v


class ComparisonPoint(BaseModel):
    feature: str
    product_a: str
    product_b: str
    winner: str | None = None  # product_id of winner, or None for ties


class CompareResponse(BaseModel):
    comparisonPoints: list[ComparisonPoint]
    recommendedProductId: str
    recommendationReasoning: str
    suggestionText: str | None = None  # conversational 1-liner for the chat bubble
    confidence: int | None = Field(default=None, ge=0, le=100,
        description="LLM-rated confidence in the recommendation (0-100). Drives the UI bar.")
    intent: Literal["detail", "alternative"] | None = None
    # Populated when intent="alternative": the new product pair the table should switch to.
    alternativeProducts: list[SelectedProduct] | None = None


# ---------- Privacy-safe internal view ----------

class SafeProduct(BaseModel):
    """The ONLY product view the LLM is allowed to see.

    Raw backend numbers (stock_on_hand, units_sold, return_rate, etc.) are
    bucketed into qualitative signals before reaching this class.
    """
    product_id: str
    name: str
    description: str
    selling_price: float
    list_price: float | None = None
    category: str
    attributes: dict[str, Any] = Field(default_factory=dict)
    stock_status: Literal["in_stock", "low_stock", "out_of_stock"]
    popularity: Literal["low", "medium", "high", "bestseller"]
    reliability_signal: Literal["good", "average", "concerning"]
    current_discount: str | None = None
