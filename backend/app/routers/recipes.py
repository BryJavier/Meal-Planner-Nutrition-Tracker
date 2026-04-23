import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.recipe import Recipe
from app.models.recipe_ingredient import RecipeIngredient
from app.models.user import User
from app.schemas.recipe import RecipeCreate, RecipeUpdate, RecipeRead, RecipeIngredientRead, MacroRead
from app.services.nutrition_service import compute_recipe_macros


def _eager_recipe_stmt(base_stmt):
    return base_stmt.options(
        selectinload(Recipe.recipe_ingredients).selectinload(RecipeIngredient.ingredient)
    )

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


def _build_recipe_read(recipe: Recipe) -> RecipeRead:
    ingredients = []
    for ri in recipe.recipe_ingredients:
        ing = ri.ingredient
        factor = ri.quantity_g / 100.0
        ingredients.append(RecipeIngredientRead(
            id=ri.id,
            ingredient_id=ri.ingredient_id,
            quantity_g=ri.quantity_g,
            display_amount=ri.display_amount,
            display_unit=ri.display_unit,
            ingredient_name=ing.name,
            calories=round(ing.calories_per_100g * factor, 1),
            protein=round(ing.protein_per_100g * factor, 1),
            carbs=round(ing.carbs_per_100g * factor, 1),
            fat=round(ing.fat_per_100g * factor, 1),
        ))
    nutrition = compute_recipe_macros(recipe) if recipe.recipe_ingredients else None
    return RecipeRead(
        id=recipe.id,
        user_id=recipe.user_id,
        name=recipe.name,
        description=recipe.description,
        instructions=recipe.instructions,
        servings=recipe.servings,
        prep_time_minutes=recipe.prep_time_minutes,
        cook_time_minutes=recipe.cook_time_minutes,
        tags=recipe.tags,
        is_ai_generated=recipe.is_ai_generated,
        ingredients=ingredients,
        nutrition_per_serving=nutrition,
    )


@router.get("", response_model=list[RecipeRead])
async def list_recipes(
    search: str | None = Query(default=None),
    tags: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Recipe).where(Recipe.user_id == current_user.id)
    if search:
        stmt = stmt.where(Recipe.name.ilike(f"%{search}%"))
    result = await db.execute(_eager_recipe_stmt(stmt).order_by(Recipe.created_at.desc()))
    return [_build_recipe_read(r) for r in result.scalars().all()]


@router.post("", response_model=RecipeRead, status_code=201)
async def create_recipe(
    body: RecipeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recipe = Recipe(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=body.name,
        description=body.description,
        instructions=body.instructions,
        servings=body.servings,
        prep_time_minutes=body.prep_time_minutes,
        cook_time_minutes=body.cook_time_minutes,
        tags=body.tags,
    )
    db.add(recipe)

    for ing_data in body.ingredients:
        db.add(RecipeIngredient(
            id=str(uuid.uuid4()),
            recipe_id=recipe.id,
            ingredient_id=ing_data.ingredient_id,
            quantity_g=ing_data.quantity_g,
            display_amount=ing_data.display_amount,
            display_unit=ing_data.display_unit,
        ))

    await db.commit()
    result = await db.execute(_eager_recipe_stmt(select(Recipe).where(Recipe.id == recipe.id)))
    return _build_recipe_read(result.scalar_one())


@router.get("/{recipe_id}", response_model=RecipeRead)
async def get_recipe(recipe_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(_eager_recipe_stmt(
        select(Recipe).where(Recipe.id == recipe_id, Recipe.user_id == current_user.id)
    ))
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return _build_recipe_read(recipe)


@router.get("/{recipe_id}/nutrition", response_model=MacroRead)
async def get_recipe_nutrition(recipe_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id, Recipe.user_id == current_user.id))
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return compute_recipe_macros(recipe)


@router.patch("/{recipe_id}", response_model=RecipeRead)
async def update_recipe(recipe_id: str, body: RecipeUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id, Recipe.user_id == current_user.id))
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    for field, value in body.model_dump(exclude_none=True, exclude={"ingredients"}).items():
        setattr(recipe, field, value)

    if body.ingredients is not None:
        for ri in recipe.recipe_ingredients:
            await db.delete(ri)
        for ing_data in body.ingredients:
            db.add(RecipeIngredient(
                id=str(uuid.uuid4()),
                recipe_id=recipe.id,
                ingredient_id=ing_data.ingredient_id,
                quantity_g=ing_data.quantity_g,
                display_amount=ing_data.display_amount,
                display_unit=ing_data.display_unit,
            ))

    await db.commit()
    result = await db.execute(_eager_recipe_stmt(select(Recipe).where(Recipe.id == recipe.id)))
    return _build_recipe_read(result.scalar_one())


@router.delete("/{recipe_id}", status_code=204)
async def delete_recipe(recipe_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id, Recipe.user_id == current_user.id))
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    await db.delete(recipe)
    await db.commit()
