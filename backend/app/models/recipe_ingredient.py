import uuid
from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    recipe_id: Mapped[str] = mapped_column(String, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    ingredient_id: Mapped[str] = mapped_column(String, ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False)
    quantity_g: Mapped[float] = mapped_column(Float, nullable=False)
    display_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    display_unit: Mapped[str | None] = mapped_column(String(50), nullable=True)

    recipe: Mapped["Recipe"] = relationship("Recipe", back_populates="recipe_ingredients")  # noqa: F821
    ingredient: Mapped["Ingredient"] = relationship("Ingredient", lazy="selectin")  # noqa: F821
