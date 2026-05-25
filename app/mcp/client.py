"""MCP client factory — picks mock or real based on ZOHO_MCP_MODE."""
from functools import lru_cache
from typing import Protocol

from app.config import get_settings
from app.mcp.mock_client import MockMCPClient
from app.mcp.real_client import RealMCPClient


class MCPClient(Protocol):
    def get_product_summary(self, product_ids: list[str]) -> list[dict]: ...
    def get_product_full(self, product_id: str) -> dict | None: ...
    def get_catalog(self) -> list[dict]: ...


@lru_cache
def get_mcp_client() -> MCPClient:
    settings = get_settings()
    if settings.zoho_mcp_mode == "real":
        return RealMCPClient(
            base_url=settings.zoho_mcp_url,
            token=settings.zoho_mcp_token,
            org_id=settings.zoho_org_id,
        )
    return MockMCPClient()
