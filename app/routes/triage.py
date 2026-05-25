"""POST /canshowComparison — LLM-driven popup triage with deterministic fallback."""
from fastapi import APIRouter, Depends

from app.llm.claude import ClaudeClient
from app.mcp.client import MCPClient, get_mcp_client
from app.models import CanShowComparisonRequest, CanShowComparisonResponse
from app.routes.compare import get_llm_client
from app.services.selector import decide

router = APIRouter()


@router.post("/canshowComparison", response_model=CanShowComparisonResponse)
def can_show_comparison(
    payload: CanShowComparisonRequest,
    client: MCPClient = Depends(get_mcp_client),
    llm: ClaudeClient = Depends(get_llm_client),
) -> CanShowComparisonResponse:
    return decide(payload.product_ids, client, llm)
