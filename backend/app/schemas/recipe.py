from pydantic import BaseModel, Field


class RecipeIngredientCreate(BaseModel):
    ingredient_id: str
    quantity_g: float = Field(gt=0)
    display_amount: float | None = None
    display_unit: str | None = None


class RecipeIngredientRead(BaseModel):
    id: str
    ingredient_id: str
    quantity_g: float
    display_amount: float | None
    display_unit: str | None
    ingredient_name: str | None = None
    calories: float | None = None
    protein: float | None = None
    carbs: float | None = None
    fat: float | None = None

    model_config = {"from_attributes": True}


class RecipeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    instructions: str | None = None
    servings: int = Field(default=1, ge=1)
    prep_time_minutes: int | None = Field(default=None, ge=0)
    cook_time_minutes: int | None = Field(default=None, ge=0)
    tags: list[str] | None = None
    ingredients: list[RecipeIngredientCreate] = []


class RecipeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    instructions: str | None = None
    servings: int | None = Field(default=None, ge=1)
    prep_time_minutes: int | None = None
    cook_time_minutes: int | None = None
    tags: list[str] | None = None
    ingredients: list[RecipeIngredientCreate] | None = None


class MacroRead(BaseModel):
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class RecipeRead(BaseModel):
    id: str
    user_id: str
    name: str
    description: str | None
    instructions: str | None
    servings: int
    prep_time_minutes: int | None
    cook_time_minutes: int | None
    tags: list[str] | None
    is_ai_generated: bool
    ingredients: list[RecipeIngredientRead] = []
    nutrition_per_serving: MacroRead | None = None

    model_config = {"from_attributes": True}
