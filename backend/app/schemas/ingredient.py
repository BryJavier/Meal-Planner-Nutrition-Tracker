from pydantic import BaseModel, Field


class IngredientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    calories_per_100g: float = Field(ge=0)
    protein_per_100g: float = Field(ge=0)
    carbs_per_100g: float = Field(ge=0)
    fat_per_100g: float = Field(ge=0)
    unit: str = "g"


class IngredientRead(BaseModel):
    id: str
    name: str
    calories_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fat_per_100g: float
    unit: str
    created_by: str | None

    model_config = {"from_attributes": True}
