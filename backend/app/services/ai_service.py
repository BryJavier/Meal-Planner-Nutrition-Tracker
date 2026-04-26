import json
import re
from anthropic import AsyncAnthropic
from app.models.user import User
from app.utils.crypto import decrypt

MEAL_SYSTEM_PROMPT = """You are a professional nutritionist and chef.
Generate exactly 3-5 meal suggestions that fit the user's dietary goals.

Return plain text only. Follow this EXACT structure for every suggestion:

**[Meal Name]**
[1-2 sentence description of the dish.]
Macros: [calories] kcal | [protein]g protein | [carbs]g carbs | [fat]g fat
Why it fits: [One sentence on why this suits the user's goals.]

---

Formatting rules:
- Put the meal name on its own line.
- Put the description on its own line.
- Put the Macros line on its own line.
- Put the Why it fits line on its own line.
- Put --- on its own line between suggestions.
- Never merge headers and content onto the same line.
- Do not include any text before the first suggestion or after the last one.
- Do not number the items."""

RECIPE_SYSTEM_PROMPT = """You are a professional nutritionist and chef.
Return ONLY valid JSON matching this exact schema (no markdown, no extra text):
{
  "name": "string",
  "description": "string",
  "instructions": "string",
  "servings": 2,
  "prep_time_minutes": 10,
  "cook_time_minutes": 20,
  "tags": ["string"],
  "ingredients": [
    {
      "name": "string",
      "quantity_g": 100.0,
      "display_amount": 1.0,
      "display_unit": "cup",
      "calories_per_100g": 150.0,
      "protein_per_100g": 5.0,
      "carbs_per_100g": 20.0,
      "fat_per_100g": 3.0
    }
  ]
}"""


def _client_for(user: User) -> AsyncAnthropic:
    if not user.anthropic_api_key_encrypted:
        raise ValueError("No Anthropic API key set. Add one in Settings.")
    return AsyncAnthropic(api_key=decrypt(user.anthropic_api_key_encrypted))


def _strip_code_fences(text: str) -> str:
    # Remove ```json ... ``` or ``` ... ``` wrappers Claude sometimes adds
    text = text.strip()
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    return text.strip()


def _user_context(user: User) -> str:
    parts = []
    if user.calorie_goal:
        parts.append(f"Daily calorie goal: {user.calorie_goal} kcal")
    if user.protein_goal_g:
        parts.append(f"Protein goal: {user.protein_goal_g}g, Carbs: {user.carbs_goal_g}g, Fat: {user.fat_goal_g}g")
    if user.dietary_preferences:
        parts.append(f"Dietary preferences: {', '.join(user.dietary_preferences)}")
    return ". ".join(parts) if parts else "No specific goals set."


async def stream_meal_suggestions(user: User, meal_slot: str, additional_context: str | None = None):
    user_msg = f"{_user_context(user)}\n\nSuggest meals for: {meal_slot}"
    if additional_context:
        user_msg += f"\nAdditional context: {additional_context}"

    async with _client_for(user).messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=MEAL_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def generate_recipe(user: User, name: str, description: str | None, target_calories: int | None) -> dict:
    user_msg = f"{_user_context(user)}\n\nCreate a recipe for: {name}"
    if description:
        user_msg += f"\nDescription: {description}"
    if target_calories:
        user_msg += f"\nTarget calories per serving: ~{target_calories} kcal"

    message = await _client_for(user).messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=RECIPE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = _strip_code_fences(message.content[0].text)
    return json.loads(raw)
