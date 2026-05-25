"""Thin Anthropic SDK wrapper.

Returns the raw text response from Claude. JSON parsing and schema
validation happen in the comparator service, not here.
"""
from anthropic import Anthropic

from app.config import get_settings


class ClaudeClient:
    def __init__(self) -> None:
        settings = get_settings()
        self._client = Anthropic(api_key=settings.anthropic_api_key)
        self._model = settings.claude_model

    def complete_json(self, system: str, user_payload: str, max_tokens: int = 1024) -> str:
        """Call Claude with a JSON-only contract and return the text content.

        The caller is responsible for parsing + validating.
        """
        resp = self._client.messages.create(
            model=self._model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user_payload}],
        )
        # Concatenate text blocks (Claude can split into multiple).
        parts = [b.text for b in resp.content if getattr(b, "type", None) == "text"]
        return "".join(parts).strip()
