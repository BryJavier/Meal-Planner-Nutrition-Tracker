import anthropic
import json

def fetch_meal_suggestion(api_key: str, meal_slot: str = "lunch", preferences: str = None):
    """Fetch AI-generated meal suggestion from Anthropic based on meal slot and preferences."""
    if not api_key:
        raise ValueError("Anthropic API key is not configured for this user")
    
    client = anthropic.Anthropic(api_key=api_key)
    
    # Build context-aware prompt
    prompt = f"""Generate a healthy {meal_slot.lower()} meal suggestion"""
    if preferences:
        prompt += f""". The user has the following preferences or ingredients available: {preferences}"""
    
    prompt += """. Return ONLY valid JSON with this structure:
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
    print(f"DEBUG: API Response: {response_text[:200]}")  # Log first 200 chars
    
    if not response_text or not response_text.strip():
        raise ValueError("Anthropic API returned empty response")
    
    # Try to extract JSON from response (in case there's surrounding text)
    try:
        suggestion = json.loads(response_text)
    except json.JSONDecodeError:
        # Try to find JSON in the response
        import re
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            suggestion = json.loads(json_match.group())
        else:
            raise ValueError(f"Could not parse JSON from response: {response_text}")
    
    return suggestion
