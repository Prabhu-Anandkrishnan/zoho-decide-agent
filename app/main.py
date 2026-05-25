"""FastAPI entry point for the Zoho Commerce 'Help me to decide' PoC."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes import compare as compare_route
from app.routes import triage as triage_route

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

app = FastAPI(title="Zoho Commerce — Help me to decide", version="0.1.0")

_settings = get_settings()
_cors_raw = (_settings.cors_origins or "*").strip()
if _cors_raw == "*":
    _cors_origins = ["*"]
else:
    _cors_origins = [o.strip() for o in _cors_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(triage_route.router)
app.include_router(compare_route.router)


@app.get("/health")
def health() -> dict:
    s = get_settings()
    return {"status": "ok", "mcp_mode": s.zoho_mcp_mode, "model": s.claude_model}
