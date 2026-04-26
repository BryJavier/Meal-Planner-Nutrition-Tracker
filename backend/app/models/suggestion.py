from sqlalchemy import Column, String, Integer, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Suggestion(Base):
    __tablename__ = "suggestions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("user.id"), nullable=False)
    meal_name = Column(String, nullable=False)
    ingredients = Column(JSON, nullable=False)
    prep_time = Column(Integer, nullable=False)
    servings = Column(Integer, nullable=False)
    macros = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="suggestions")
