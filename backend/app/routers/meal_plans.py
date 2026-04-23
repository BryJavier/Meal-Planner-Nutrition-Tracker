import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.meal_plan import MealPlan
from app.models.meal_plan_entry import MealPlanEntry
from app.models.recipe import Recipe
from app.models.user import User
from app.schemas.meal_plan import MealPlanCreate, MealPlanRead, EntryCreate, EntryUpdate, EntryRead
from app.schemas.recipe import RecipeRead
from app.routers.recipes import _build_recipe_read

router = APIRouter(prefix="/api/meal-plans", tags=["meal-plans"])


def _build_entry_read(entry: MealPlanEntry) -> EntryRead:
    return EntryRead(
        id=entry.id,
        recipe_id=entry.recipe_id,
        day_of_week=entry.day_of_week,
        meal_slot=entry.meal_slot,
        servings=entry.servings,
        position=entry.position,
        recipe=_build_recipe_read(entry.recipe) if entry.recipe else None,
    )


def _build_plan_read(plan: MealPlan) -> MealPlanRead:
    return MealPlanRead(
        id=plan.id,
        user_id=plan.user_id,
        week_start_date=plan.week_start_date,
        name=plan.name,
        entries=[_build_entry_read(e) for e in sorted(plan.entries, key=lambda e: (e.day_of_week, e.meal_slot, e.position))],
    )


@router.get("", response_model=list[MealPlanRead])
async def list_plans(
    week_start: date | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(MealPlan).where(MealPlan.user_id == current_user.id)
    if week_start:
        stmt = stmt.where(MealPlan.week_start_date == week_start)
    result = await db.execute(stmt.order_by(MealPlan.week_start_date.desc()))
    return [_build_plan_read(p) for p in result.scalars().all()]


@router.post("", response_model=MealPlanRead, status_code=201)
async def create_plan(body: MealPlanCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = MealPlan(id=str(uuid.uuid4()), user_id=current_user.id, week_start_date=body.week_start_date, name=body.name)
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return _build_plan_read(plan)


@router.get("/{plan_id}", response_model=MealPlanRead)
async def get_plan(plan_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(MealPlan).where(MealPlan.id == plan_id, MealPlan.user_id == current_user.id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return _build_plan_read(plan)


@router.delete("/{plan_id}", status_code=204)
async def delete_plan(plan_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(MealPlan).where(MealPlan.id == plan_id, MealPlan.user_id == current_user.id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    await db.delete(plan)
    await db.commit()


@router.post("/{plan_id}/entries", response_model=EntryRead, status_code=201)
async def add_entry(plan_id: str, body: EntryCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(MealPlan).where(MealPlan.id == plan_id, MealPlan.user_id == current_user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Plan not found")

    recipe_result = await db.execute(select(Recipe).where(Recipe.id == body.recipe_id, Recipe.user_id == current_user.id))
    if not recipe_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Recipe not found")

    entry = MealPlanEntry(id=str(uuid.uuid4()), meal_plan_id=plan_id, **body.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return _build_entry_read(entry)


@router.patch("/{plan_id}/entries/{entry_id}", response_model=EntryRead)
async def update_entry(plan_id: str, entry_id: str, body: EntryUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(MealPlanEntry).join(MealPlan).where(
            MealPlanEntry.id == entry_id,
            MealPlanEntry.meal_plan_id == plan_id,
            MealPlan.user_id == current_user.id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(entry, field, value)
    await db.commit()
    await db.refresh(entry)
    return _build_entry_read(entry)


@router.delete("/{plan_id}/entries/{entry_id}", status_code=204)
async def delete_entry(plan_id: str, entry_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(MealPlanEntry).join(MealPlan).where(
            MealPlanEntry.id == entry_id,
            MealPlanEntry.meal_plan_id == plan_id,
            MealPlan.user_id == current_user.id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    await db.delete(entry)
    await db.commit()
