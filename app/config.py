"""Application configuration loaded from environment variables."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", env_ignore_empty=True)

    anthropic_api_key: str = ""
    claude_model: str = "claude-haiku-4-5-20251001"

    zoho_mcp_mode: str = "mock"           # "mock" | "real"
    zoho_mcp_url: str = ""
    zoho_mcp_token: str = ""
    zoho_org_id: str = ""                  # Zoho Commerce organization_id

    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # Comma-separated origins for CORS, or "*" for all (PoC / local dev).
    cors_origins: str = (
        "http://localhost:5174,http://127.0.0.1:5174,"
        "http://localhost:8000,http://localhost:8001,"
        "https://prabhu1.localtest.zohopages.com:8441"
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
