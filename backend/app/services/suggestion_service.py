import json
import re
from anthropic import AsyncAnthropic


SUGGESTION_PROMPT = """You are a professional nutritionist and chef.
Return ONLY valid JSON — no markdown, no explanation, no extra text.

Generate exactly 3 to 5 meal suggestions that fit the user's meal slot and any stated goals.

Return a JSON array where every item follows this exact schema:

[
  {
    "meal_name": "string",
    "description": "1-2 sentence description of the dish",
    "prep_time": <integer minutes>,
    "cook_time": <integer minutes>,
    "servings": <integer>,
    "ingredients": [
      {
        "name": "string",
        "quantity_g": <grams as number>,
        "display_amount": <number or null>,
        "display_unit": "string or null",
        "calories_per_100g": <number>,
        "protein_per_100g": <number>,
        "carbs_per_100g": <number>,
        "fat_per_100g": <number>
      }
    ],
    "instructions": "1. First step with enough detail to actually cook the dish.\n2. Second step.\n3. Continue until the dish is complete.",
    "macros": {
      "calories": <number, total for all servings>,
      "protein": <number grams, total>,
      "carbs": <number grams, total>,
      "fats": <number grams, total>
    }
  }
]

Rules:
- instructions must be numbered steps (1. 2. 3. ...), each on its own line, with enough detail that someone can follow them without prior knowledge of the dish.
- macros must be consistent with the ingredient list (sum of calories_per_100g * quantity_g / 100 for each ingredient).
- All numeric fields must be numbers, not strings.
- Do not include any text before or after the JSON array."""


async def fetch_meal_suggestions(
    api_key: str,
    meal_slot: str = "lunch",
    preferences: str | None = None,
    user_context: str | None = None,
) -> list[dict]:
    """Return a list of 3–5 AI-generated meal suggestions with full per-ingredient nutrition."""
    if not api_key:
        raise ValueError("Anthropic API key is not configured for this user")

    client = AsyncAnthropic(api_key=api_key)

    user_msg = f"Meal slot: {meal_slot}"
    if user_context:
        user_msg += f"\nUser goals: {user_context}"
    if preferences:
        user_msg += f"\nPreferences / available ingredients: {preferences}"

    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8096,
        system=SUGGESTION_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )

    response_text = message.content[0].text.strip()

    # Strip accidental code fences
    response_text = re.sub(r'^```(?:json)?\s*', '', response_text)
    response_text = re.sub(r'\s*```$', '', response_text).strip()

    try:
        result = json.loads(response_text)
    except json.JSONDecodeError:
        match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if match:
            result = json.loads(match.group())
        else:
            raise ValueError(f"Could not parse JSON array from response: {response_text[:300]}")

    if not isinstance(result, list):
        raise ValueError("Expected a JSON array of suggestions")

    return result
