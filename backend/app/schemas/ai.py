from typing import Literal
from pydantic import BaseModel


class MealSuggestionRequest(BaseModel):
    meal_slot: Literal["breakfast", "lunch", "dinner", "snack"]
    additional_context: str | None = None


class RecipeSuggestionRequest(BaseModel):
    name: str
    description: str | None = None
    target_calories: int | None = None
