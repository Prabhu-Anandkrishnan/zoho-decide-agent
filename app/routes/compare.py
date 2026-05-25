"""POST /compare — LLM-driven deep comparison."""
from functools import lru_cache

from fastapi import APIRouter, Depends

from app.llm.claude import ClaudeClient
from app.mcp.client import MCPClient, get_mcp_client
from app.models import CompareRequest, CompareResponse
from app.services.comparator import compare

router = APIRouter()


@lru_cache
def get_llm_client() -> ClaudeClient:
    return ClaudeClient()


@router.post("/compare", response_model=CompareResponse)
def compare_products(
    payload: CompareRequest,
    client: MCPClient = Depends(get_mcp_client),
    llm: ClaudeClient = Depends(get_llm_client),
) -> CompareResponse:
    return compare(payload.product_ids, client, llm, user_input=payload.user_input)
