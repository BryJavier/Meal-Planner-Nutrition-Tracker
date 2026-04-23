from datetime import date
from pydantic import BaseModel, Field
from app.schemas.recipe import RecipeRead


class MealPlanCreate(BaseModel):
    week_start_date: date
    name: str | None = None


class EntryCreate(BaseModel):
    recipe_id: str
    day_of_week: int = Field(ge=0, le=6)
    meal_slot: str = Field(pattern="^(breakfast|lunch|dinner|snack)$")
    servings: float = Field(default=1.0, gt=0)
    position: int = 0


class EntryUpdate(BaseModel):
    day_of_week: int | None = Field(default=None, ge=0, le=6)
    meal_slot: str | None = Field(default=None, pattern="^(breakfast|lunch|dinner|snack)$")
    servings: float | None = Field(default=None, gt=0)
    position: int | None = None


class EntryRead(BaseModel):
    id: str
    recipe_id: str
    day_of_week: int
    meal_slot: str
    servings: float
    position: int
    recipe: RecipeRead | None = None

    model_config = {"from_attributes": True}


class MealPlanRead(BaseModel):
    id: str
    user_id: str
    week_start_date: date
    name: str | None
    entries: list[EntryRead] = []

    model_config = {"from_attributes": True}
