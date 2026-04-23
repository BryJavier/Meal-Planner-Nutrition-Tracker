from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.meal_plan import MealPlan
from app.models.meal_plan_entry import MealPlanEntry
from app.models.user import User
from app.schemas.recipe import MacroRead
from app.services.nutrition_service import compute_recipe_macros

router = APIRouter(prefix="/api/nutrition", tags=["nutrition"])


async def _get_day_macros(db: AsyncSession, user_id: str, target_date: date) -> MacroRead:
    monday = target_date - timedelta(days=target_date.weekday())
    day_of_week = target_date.weekday()

    result = await db.execute(
        select(MealPlan).where(MealPlan.user_id == user_id, MealPlan.week_start_date == monday)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        return MacroRead(calories=0, protein_g=0, carbs_g=0, fat_g=0)

    totals = MacroRead(calories=0, protein_g=0, carbs_g=0, fat_g=0)
    for entry in plan.entries:
        if entry.day_of_week == day_of_week and entry.recipe:
            m = compute_recipe_macros(entry.recipe, entry.servings)
            totals.calories += m.calories
            totals.protein_g += m.protein_g
            totals.carbs_g += m.carbs_g
            totals.fat_g += m.fat_g

    return MacroRead(
        calories=round(totals.calories, 1),
        protein_g=round(totals.protein_g, 1),
        carbs_g=round(totals.carbs_g, 1),
        fat_g=round(totals.fat_g, 1),
    )


@router.get("/daily", response_model=MacroRead)
async def daily_nutrition(
    date: date = Query(default_factory=date.today),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await _get_day_macros(db, current_user.id, date)


@router.get("/weekly", response_model=list[dict])
async def weekly_nutrition(
    week_start: date = Query(default_factory=date.today),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    monday = week_start - timedelta(days=week_start.weekday())
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    result = []
    for i in range(7):
        day_date = monday + timedelta(days=i)
        macros = await _get_day_macros(db, current_user.id, day_date)
        result.append({"day": days[i], "date": str(day_date), **macros.model_dump()})
    return result


@router.get("/summary", response_model=dict)
async def nutrition_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    actuals = await _get_day_macros(db, current_user.id, today)
    return {
        "date": str(today),
        "actuals": actuals.model_dump(),
        "goals": {
            "calories": current_user.calorie_goal,
            "protein_g": current_user.protein_goal_g,
            "carbs_g": current_user.carbs_goal_g,
            "fat_g": current_user.fat_goal_g,
        },
    }
