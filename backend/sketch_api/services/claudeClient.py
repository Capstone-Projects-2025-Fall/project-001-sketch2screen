# services/claude_client.py
#This file consists of all the code that is required to interact with the Claude API
import base64
from typing import Optional, Sequence

from django.conf import settings
from anthropic import AsyncAnthropic

import os

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


def _client() -> AsyncAnthropic:
    key = ""
    try:
        key = _load_anthropic_key_from_file()
    except Exception:
        key = os.environ.get("ANTHROPIC_API_KEY")
    
    if not key or key == "":
        raise RuntimeError("Anthropic API key is missing.")

    return AsyncAnthropic(api_key=key)

#This function would help extract text from the response received from Claude API focusing on only the output.
def _extract_text(resp) -> str:
    """Concatenate text blocks from Claude response."""
    parts: list[str] = []
    for block in getattr(resp, "content", []) or []:
        if getattr(block, "type", None) == "text":
            parts.append(getattr(block, "text", "") or "")
    return "".join(parts).strip()


async def image_to_html_css(image_bytes: bytes, media_type: str = "image/png", prompt: Optional[str] = None) -> str:
    """
    Send one image + optional prompt to Claude and get back HTML/CSS.
    Returns HTML string (sanitize on the client before injecting into DOM).
    """
    b64 = base64.b64encode(image_bytes).decode("utf-8")

    system_msg = (
        "You are an expert frontend developer specializing in converting UI sketches into "
        "modern, high-fidelity, pixel-perfect, production-ready HTML with Tailwind CSS. Your code is clean, semantic, "
        "accessible, and follows modern web development best practices."
    )
    user_instruction = prompt or (
            """Convert the provided UI sketch into complete, functional HTML with Tailwind CSS styling.

            CRITICAL OUTPUT REQUIREMENTS:
            - Ignore the outer bounding box of sketch as it is for user to assume as a viewport.
            - Return ONLY raw HTML code - no markdown fences, no explanations, no preamble
            - This renders in an iframe, so include complete document structure with <!DOCTYPE html>
            - Set body to full viewport dimensions: class="h-screen w-screen" (100vh height, 100vw width)
            - Do not add padding to outside of the borders, only use spacing within the layout itself
            - Ensure the color scheme matches the sketch.

            CODE QUALITY STANDARDS:
            - Design generated should be of extremely high fidelity.
            - Use semantic HTML5 elements (<header>, <nav>, <main>, <section>, <article>, <footer>)
            - Include all necessary JavaScript for interactivity (e.g., dropdowns, modals, tabs) 
            - Minimize unnecessary wrapper divs - keep markup lean
            - Ensure all elements have explicit dimensions or content to render properly
            - Make layouts responsive using Tailwind's responsive prefixes (sm:, md:, lg:)
            - The design should look production-ready, not like a prototype

            DESIGN FIDELITY:
            - Match the sketch's layout and color scheme but make it modern, clean, and visually appealing
            - If elements are labeled with HTML tag names (e.g., "button", "input"), use those exact tags
            - Preserve all text content visible in the sketch
            - Implement smooth transitions and animations where appropriate
            - For any images in the design:
                - Use placeholder divs with gradients or SVG icons
                - Make placeholder visually appealing (not just gray boxes)
            - Represent icons
            * Icons: Use emoji, Unicode symbols, or labeled boxes like <div class="w-6 h-6 bg-gray-300 rounded"></div>


            STYLING APPROACH:
            - Apply Tailwind classes directly to elements for colors, spacing, typography, shadows, borders, etc.
            - Ensure proper visual hierarchy with appropriate font sizes, weights, and spacing
            - Add hover states where interactive elements are present (buttons, links)

            ADDITIONAL REQUIREMENTS:
            - Make the background cyan blue.

            Begin your response with <!DOCTYPE html> and nothing else."""
       )

    client = _client()
    model = getattr(settings, "CLAUDE_MODEL", "claude-sonnet-4-20250514")

    resp = await client.messages.create(
        model=model,
        max_tokens=3000,
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
