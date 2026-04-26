from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.database import get_db
from app.models.recipe import Recipe
from app.models.ingredient import Ingredient
from app.models.recipe_ingredient import RecipeIngredient
from app.dependencies import get_current_user
from app.services.suggestion_service import fetch_meal_suggestions
from app.utils.crypto import decrypt
from pydantic import BaseModel

router = APIRouter(prefix="/api/suggestions", tags=["suggestions"])


class FetchSuggestionRequest(BaseModel):
    meal_slot: str = "lunch"
    preferences: str | None = None


class ConvertToRecipeRequest(BaseModel):
    meal_name: str
    description: str | None = None
    instructions: str | None = None
    ingredients: list  # each item has full nutrition per-100g fields
    prep_time: int
    cook_time: int | None = None
    servings: int
    macros: dict


def _user_context(user) -> str | None:
    parts = []
    if user.calorie_goal:
        parts.append(f"Daily calorie goal: {user.calorie_goal} kcal")
    if user.protein_goal_g:
        parts.append(
            f"Protein: {user.protein_goal_g}g, Carbs: {user.carbs_goal_g}g, Fat: {user.fat_goal_g}g"
        )
    if user.dietary_preferences:
        parts.append(f"Dietary preferences: {', '.join(user.dietary_preferences)}")
    return ". ".join(parts) if parts else None


@router.post("/fetch", response_model=list)
async def get_meal_suggestions(
    request: FetchSuggestionRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return 3–5 AI-generated meal suggestions with per-ingredient nutrition data."""
    if not current_user.anthropic_api_key_encrypted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Anthropic API key set. Add one in Settings.",
        )
    try:
        api_key = decrypt(current_user.anthropic_api_key_encrypted)
        suggestions = await fetch_meal_suggestions(
            api_key,
            meal_slot=request.meal_slot,
            preferences=request.preferences,
            user_context=_user_context(current_user),
        )
        return suggestions
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch suggestions: {str(e)}",
        )


@router.post("/convert-to-recipe", status_code=201)
async def convert_suggestion_to_recipe(
    data: ConvertToRecipeRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Persist one meal suggestion as a recipe with accurate per-ingredient nutrition."""
    try:
        new_recipe = Recipe(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            name=data.meal_name,
            description=data.description,
            instructions=data.instructions,
            servings=data.servings,
            prep_time_minutes=data.prep_time,
            cook_time_minutes=data.cook_time,
            is_ai_generated=True,
        )
        db.add(new_recipe)

        for ing in data.ingredients:
            ingredient = Ingredient(
                id=str(uuid.uuid4()),
                name=ing["name"],
                # Use the AI-provided per-100g nutrition so macros compute correctly
                calories_per_100g=float(ing.get("calories_per_100g") or 0),
                protein_per_100g=float(ing.get("protein_per_100g") or 0),
                carbs_per_100g=float(ing.get("carbs_per_100g") or 0),
                fat_per_100g=float(ing.get("fat_per_100g") or 0),
                unit="g",
                created_by=current_user.id,
            )
            db.add(ingredient)

            db.add(RecipeIngredient(
                id=str(uuid.uuid4()),
                recipe_id=new_recipe.id,
                ingredient_id=ingredient.id,
                quantity_g=float(ing.get("quantity_g") or ing.get("amount") or 100),
                display_amount=ing.get("display_amount"),
                display_unit=ing.get("display_unit"),
            ))

        await db.commit()
        return {"id": new_recipe.id, "name": new_recipe.name}

    except Exception as e:
        import traceback
        traceback.print_exc()
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create recipe: {str(e)}",
        )
