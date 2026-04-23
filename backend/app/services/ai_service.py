import json
from anthropic import AsyncAnthropic
from app.config import settings
from app.models.user import User

client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

MEAL_SYSTEM_PROMPT = """You are a professional nutritionist and chef.
Generate 3-5 meal suggestions that fit the user's dietary goals and preferences.
For each suggestion provide:
- Name
- Brief description (1-2 sentences)
- Estimated macros per serving (calories, protein g, carbs g, fat g)
- Why it fits the user's goals
Format as a numbered list. Be specific and practical."""

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

    async with client.messages.stream(
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

    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=RECIPE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )
    return json.loads(message.content[0].text)
