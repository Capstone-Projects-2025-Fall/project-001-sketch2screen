import base64
from typing import Optional, Sequence

from django.conf import settings
from anthropic import AsyncAnthropic
import json
import os
import json

VARIATION_COUNT = 3  # default number of variations to generate

def _load_anthropic_key_from_file(key_name: str) -> str:
    """Read API key from plaintext file defined in settings."""
    key_path = getattr(settings, key_name, None)
    if not key_path:
        raise RuntimeError(f"{key_name} not configured.")
    with open(key_path, "r", encoding="utf-8") as f:
        key = f.read().strip()
    if not key:
        raise RuntimeError("Anthropic API key file was empty.")
    return key

#This function would help extract text from the response received from Claude API focusing on only the output.
def _extract_text(resp) -> str:
    """Concatenate text blocks from Claude response."""
    parts: list[str] = []
    for block in getattr(resp, "content", []) or []:
        if getattr(block, "type", None) == "text":
            parts.append(getattr(block, "text", "") or "")
    return "".join(parts).strip()

def _variations_client() -> AsyncAnthropic:
    """
    Separate client for variations using second API key.
    Falls back to main key if variations key not configured.
    """
    try:
       key = _load_anthropic_key_from_file("CLAUDE_VARIATION_KEY")
    except Exception:
        key = os.environ.get("ANTHROPIC_VARIATIONS_API_KEY")
    
    if not key:
        # Fallback to main key
        try:
            key = _load_anthropic_key_from_file("CLAUDE_API_KEY")
        except Exception:
            key = os.environ.get("ANTHROPIC_API_KEY")
    
    if not key or key == "":
        raise RuntimeError("Anthropic API key for variations is missing.")
    
    return AsyncAnthropic(api_key=key)

async def generate_component_variations(
    element_html: str,
    element_type: str,
    custom_prompt: Optional[str] = None,
    count: int = VARIATION_COUNT
) -> list[str]:
    """
    Generate design variations for a component using Claude.
    
    Args:
        element_html: HTML of the selected element
        element_type: Type like 'button', 'card', 'form', etc.
        custom_prompt: Optional user prompt for specific requirements
        count: Number of variations to generate (default: VARIATION_COUNT)
    
    Returns:
        List of HTML strings representing variations
    """
    system_msg = (
        "You are an expert UI/UX designer specializing in creating modern, "
        "visually distinct design variations. You generate clean, accessible HTML "
        "with Tailwind CSS that maintains functionality while exploring different visual styles."
    )

    if custom_prompt:
        # Custom prompt mode
        user_instruction = f"""Generate {count} design variations for this {element_type} based on the user's request:
            Component:
            {element_html}

            User request: "{custom_prompt}"

            Requirements:
            - Keep the same semantic HTML structure and tag names
            - Maintain all functionality (don't remove event handlers or data attributes)
            - Use Tailwind CSS classes for styling
            - Fulfill the user's design request while maintaining good UX
            - Ensure accessibility (proper contrast, ARIA attributes if present)
            - Make each variation visually distinct from others
            -Do not include any markdown fences

            Return ONLY a JSON array of {count} HTML strings, nothing else. No markdown, no explanation.
            Example format: ["<button class='...'>...</button>", "<button class='...'>...</button>", "<button class='...'>...</button>"]
            """
    else:
        #Auto Generation Mode
        user_instruction = f"""Generate {count} modern, visually distinct design variations for this {element_type}:

            Component:
            {element_html}

            Focus on varying:
            - Color schemes (while maintaining good contrast and accessibility)
            - Border styles and border radius
            - Shadow and depth (subtle to prominent)
            - Size and spacing (padding, margin)
            - Typography weight/style (if text is present)
            - Background styles (solid, gradients, patterns)
            - Hover/interaction states

            Requirements:
            - Keep the same semantic HTML structure and tag names
            - Maintain all functionality (don't remove event handlers or data attributes)
            - Use Tailwind CSS classes exclusively
            - Make each variation visually distinct
            - Ensure accessibility (WCAG AA contrast ratios minimum)
            - Modern, professional appearance

            Return ONLY a JSON array of {count} HTML strings, nothing else. No markdown, no explanation.
            Example format: ["<button class='...'>...</button>", "<button class='...'>...</button>", "<button class='...'>...</button>"]
            """

    client = _variations_client()
    model = getattr(settings, "CLAUDE_MODEL", "claude-sonnet-4-20250514")
    try:
        resp = await client.messages.create(
            model=model,
            max_tokens=4000,
            system=system_msg,
            messages=[
                {
                    "role": "user",
                    "content": user_instruction,
                }
            ],
        )
        
        text = _extract_text(resp)
        if not text:
            raise RuntimeError("Claude returned no text content for variations.")
        
        # Clean up response - remove markdown code fences if present
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```html"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        # Parse JSON array
        variations = json.loads(text)
        
        if not isinstance(variations, list):
            raise RuntimeError("Claude did not return a JSON array.")
        
        # Ensure we have the right count
        if len(variations) < count:
            # Pad with duplicates if needed
            while len(variations) < count:
                variations.append(variations[0] if variations else element_html)
        elif len(variations) > count:
            variations = variations[:count]
        
        return variations
    
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse Claude's response as JSON: {e}")
    except Exception as e:
        raise RuntimeError(f"Error generating variations: {e}")

    