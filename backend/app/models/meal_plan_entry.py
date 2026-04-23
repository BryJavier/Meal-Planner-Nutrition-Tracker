import uuid
from datetime import datetime
from sqlalchemy import String, SmallInteger, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class MealPlanEntry(Base):
    __tablename__ = "meal_plan_entries"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    meal_plan_id: Mapped[str] = mapped_column(String, ForeignKey("meal_plans.id", ondelete="CASCADE"), nullable=False)
    recipe_id: Mapped[str] = mapped_column(String, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    day_of_week: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 0=Monday, 6=Sunday
    meal_slot: Mapped[str] = mapped_column(String(20), nullable=False)  # breakfast/lunch/dinner/snack
    servings: Mapped[float] = mapped_column(Float, default=1.0)
    position: Mapped[int] = mapped_column(SmallInteger, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    meal_plan: Mapped["MealPlan"] = relationship("MealPlan", back_populates="entries")  # noqa: F821
    recipe: Mapped["Recipe"] = relationship("Recipe", lazy="selectin")  # noqa: F821
