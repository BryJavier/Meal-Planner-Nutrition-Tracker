import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database import get_db
from app.dependencies import get_current_user
from app.models.ingredient import Ingredient
from app.models.user import User
from app.schemas.ingredient import IngredientCreate, IngredientRead

router = APIRouter(prefix="/api/ingredients", tags=["ingredients"])


@router.get("", response_model=list[IngredientRead])
async def list_ingredients(
    search: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Ingredient).where(
        or_(Ingredient.created_by.is_(None), Ingredient.created_by == current_user.id)
    )
    if search:
        stmt = stmt.where(Ingredient.name.ilike(f"%{search}%"))
    result = await db.execute(stmt.order_by(Ingredient.name))
    return result.scalars().all()


@router.post("", response_model=IngredientRead, status_code=201)
async def create_ingredient(
    body: IngredientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ingredient = Ingredient(id=str(uuid.uuid4()), created_by=current_user.id, **body.model_dump())
    db.add(ingredient)
    await db.commit()
    return ingredient


@router.get("/{ingredient_id}", response_model=IngredientRead)
async def get_ingredient(ingredient_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Ingredient).where(Ingredient.id == ingredient_id))
    ing = result.scalar_one_or_none()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ing


@router.patch("/{ingredient_id}", response_model=IngredientRead)
async def update_ingredient(ingredient_id: str, body: IngredientCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Ingredient).where(Ingredient.id == ingredient_id))
    ing = result.scalar_one_or_none()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    if ing.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not your ingredient")
    for field, value in body.model_dump().items():
        setattr(ing, field, value)
    await db.commit()
    return ing


@router.delete("/{ingredient_id}", status_code=204)
async def delete_ingredient(ingredient_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Ingredient).where(Ingredient.id == ingredient_id))
    ing = result.scalar_one_or_none()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    if ing.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not your ingredient")
    await db.delete(ing)
    await db.commit()
