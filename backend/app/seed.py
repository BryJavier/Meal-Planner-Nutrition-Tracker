"""Run with: python -m app.seed from the backend/ directory."""
import asyncio
import uuid
from sqlalchemy import select
from app.database import AsyncSessionFactory, engine, Base
from app.models.ingredient import Ingredient

SYSTEM_INGREDIENTS = [
    {"name": "Chicken Breast", "calories_per_100g": 165, "protein_per_100g": 31, "carbs_per_100g": 0, "fat_per_100g": 3.6, "unit": "g"},
    {"name": "Brown Rice", "calories_per_100g": 111, "protein_per_100g": 2.6, "carbs_per_100g": 23, "fat_per_100g": 0.9, "unit": "g"},
    {"name": "Broccoli", "calories_per_100g": 34, "protein_per_100g": 2.8, "carbs_per_100g": 6.6, "fat_per_100g": 0.4, "unit": "g"},
    {"name": "Eggs", "calories_per_100g": 155, "protein_per_100g": 13, "carbs_per_100g": 1.1, "fat_per_100g": 11, "unit": "g"},
    {"name": "Oats", "calories_per_100g": 389, "protein_per_100g": 17, "carbs_per_100g": 66, "fat_per_100g": 7, "unit": "g"},
    {"name": "Salmon", "calories_per_100g": 208, "protein_per_100g": 20, "carbs_per_100g": 0, "fat_per_100g": 13, "unit": "g"},
    {"name": "Sweet Potato", "calories_per_100g": 86, "protein_per_100g": 1.6, "carbs_per_100g": 20, "fat_per_100g": 0.1, "unit": "g"},
    {"name": "Banana", "calories_per_100g": 89, "protein_per_100g": 1.1, "carbs_per_100g": 23, "fat_per_100g": 0.3, "unit": "g"},
    {"name": "Greek Yogurt", "calories_per_100g": 59, "protein_per_100g": 10, "carbs_per_100g": 3.6, "fat_per_100g": 0.4, "unit": "g"},
    {"name": "Olive Oil", "calories_per_100g": 884, "protein_per_100g": 0, "carbs_per_100g": 0, "fat_per_100g": 100, "unit": "ml"},
    {"name": "Spinach", "calories_per_100g": 23, "protein_per_100g": 2.9, "carbs_per_100g": 3.6, "fat_per_100g": 0.4, "unit": "g"},
    {"name": "Almonds", "calories_per_100g": 579, "protein_per_100g": 21, "carbs_per_100g": 22, "fat_per_100g": 50, "unit": "g"},
    {"name": "Whey Protein Powder", "calories_per_100g": 400, "protein_per_100g": 80, "carbs_per_100g": 8, "fat_per_100g": 5, "unit": "g"},
    {"name": "Quinoa", "calories_per_100g": 120, "protein_per_100g": 4.4, "carbs_per_100g": 22, "fat_per_100g": 1.9, "unit": "g"},
    {"name": "Avocado", "calories_per_100g": 160, "protein_per_100g": 2, "carbs_per_100g": 9, "fat_per_100g": 15, "unit": "g"},
]


async def seed():
    async with AsyncSessionFactory() as session:
        for data in SYSTEM_INGREDIENTS:
            existing = await session.execute(
                select(Ingredient).where(Ingredient.name == data["name"], Ingredient.created_by.is_(None))
            )
            if existing.scalar_one_or_none() is None:
                session.add(Ingredient(id=str(uuid.uuid4()), created_by=None, **data))
        await session.commit()
    print(f"Seeded {len(SYSTEM_INGREDIENTS)} system ingredients.")


if __name__ == "__main__":
    asyncio.run(seed())
