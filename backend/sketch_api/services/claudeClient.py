# services/claude_client.py
#This file consists of all the code that is required to interact with the Claude API
import base64
from typing import Optional, Sequence

from django.conf import settings
from anthropic import Anthropic


def _load_anthropic_key_from_file() -> str:
    """Read API key from plaintext file defined in settings."""
    key_path = getattr(settings, "CLAUDE_API_KEY", None)
    if not key_path:
        raise RuntimeError("CLAUDE_API_KEY not configured.")
    with open(key_path, "r", encoding="utf-8") as f:
        key = f.read().strip()
    if not key:
        raise RuntimeError("Anthropic API key file was empty.")
    return key


def _client() -> Anthropic:
    return Anthropic(api_key=_load_anthropic_key_from_file())

#This function would help extract text from the response received from Claude API focusing on only the output.
def _extract_text(resp) -> str:
    """Concatenate text blocks from Claude response."""
    parts: list[str] = []
    for block in getattr(resp, "content", []) or []:
        if getattr(block, "type", None) == "text":
            parts.append(getattr(block, "text", "") or "")
    return "".join(parts).strip()


def image_to_html_css(image_bytes: bytes, media_type: str = "image/png", prompt: Optional[str] = None) -> str:
    """
    Send one image + optional prompt to Claude and get back HTML/CSS.
    Returns HTML string (sanitize on the client before injecting into DOM).
    """
    b64 = base64.b64encode(image_bytes).decode("utf-8")

    system_msg = (
        "You are a frontend assistant that converts UI sketches into clean, minimal, "
        "production-ready HTML and CSS. Prefer semantic HTML, minimal wrappers, inline styles for each of the components of the image. Do not use body tag"
        "Use modern CSS if possible. Use Bootstrap or Tailwind CSS only."
    )
    user_instruction = prompt or (
        "Generate HTML and CSS that recreates the layout in the image. Only provide the code, no other text."
    )

    client = _client()
    model = getattr(settings, "CLAUDE_MODEL", "claude-sonnet-4-20250514")

    resp = client.messages.create(
        model=model,
        max_tokens=2000,
        system=system_msg,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,  # e.g., "image/png"
                            "data": b64,
                        },
                    },
                    {"type": "text", "text": user_instruction},
                ],
            }
        ],
    )
    html = _extract_text(resp)
    if not html:
        raise RuntimeError("Claude returned no text content.")
    return html
