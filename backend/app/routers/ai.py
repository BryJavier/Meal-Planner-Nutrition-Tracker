import uuid
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.recipe import Recipe
from app.models.recipe_ingredient import RecipeIngredient
from app.models.ingredient import Ingredient
from app.schemas.ai import MealSuggestionRequest, RecipeSuggestionRequest
from app.schemas.recipe import RecipeRead
from app.routers.recipes import _build_recipe_read
from app.services import ai_service

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/suggest-meals")
async def suggest_meals(
    request: Request,
    body: MealSuggestionRequest,
    current_user: User = Depends(get_current_user),
):
    async def event_generator():
        async for chunk in ai_service.stream_meal_suggestions(current_user, body.meal_slot, body.additional_context):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/suggest-recipe")
async def suggest_recipe(
    body: RecipeSuggestionRequest,
    current_user: User = Depends(get_current_user),
):
    recipe_data = await ai_service.generate_recipe(
        current_user, body.name, body.description, body.target_calories
    )
    return recipe_data


@router.post("/save-suggested", response_model=RecipeRead, status_code=201)
async def save_suggested(
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recipe = Recipe(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=body["name"],
        description=body.get("description"),
        instructions=body.get("instructions"),
        servings=body.get("servings", 1),
        prep_time_minutes=body.get("prep_time_minutes"),
        cook_time_minutes=body.get("cook_time_minutes"),
        tags=body.get("tags"),
        is_ai_generated=True,
    )
    db.add(recipe)

    for ing_data in body.get("ingredients", []):
        ing = Ingredient(
            id=str(uuid.uuid4()),
            name=ing_data["name"],
            calories_per_100g=ing_data["calories_per_100g"],
            protein_per_100g=ing_data["protein_per_100g"],
            carbs_per_100g=ing_data["carbs_per_100g"],
            fat_per_100g=ing_data["fat_per_100g"],
            unit="g",
            created_by=current_user.id,
        )
        db.add(ing)
        db.add(RecipeIngredient(
            id=str(uuid.uuid4()),
            recipe_id=recipe.id,
            ingredient_id=ing.id,
            quantity_g=ing_data["quantity_g"],
            display_amount=ing_data.get("display_amount"),
            display_unit=ing_data.get("display_unit"),
        ))

    await db.commit()
    await db.refresh(recipe)
    return _build_recipe_read(recipe)
