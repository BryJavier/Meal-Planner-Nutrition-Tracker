import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Float, ARRAY, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    calorie_goal: Mapped[int | None] = mapped_column(Integer, nullable=True)
    protein_goal_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    carbs_goal_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    fat_goal_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    dietary_preferences: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    anthropic_api_key_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    @property
    def has_anthropic_key(self) -> bool:
        return self.anthropic_api_key_encrypted is not None
