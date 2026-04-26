import anthropic
import json
from app.config import settings

async def fetch_meal_suggestion():
    """Fetch AI-generated meal suggestion from Anthropic."""
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    
    prompt = """Generate a healthy meal suggestion. Return ONLY valid JSON with this structure:
{
    "meal_name": "string",
    "ingredients": [
        {"name": "string", "amount": number, "unit": "string"}
    ],
    "prep_time": number (in minutes),
    "servings": number,
    "macros": {
        "protein": number (grams),
        "carbs": number (grams),
        "fats": number (grams)
    }
}"""
    
    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    response_text = message.content[0].text
    suggestion = json.loads(response_text)
    return suggestion
