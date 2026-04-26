import anthropic
import json

def fetch_meal_suggestion(api_key: str):
    """Fetch AI-generated meal suggestion from Anthropic."""
    if not api_key:
        raise ValueError("Anthropic API key is not configured for this user")
    
    client = anthropic.Anthropic(api_key=api_key)
    
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
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    response_text = message.content[0].text
    suggestion = json.loads(response_text)
    return suggestion
