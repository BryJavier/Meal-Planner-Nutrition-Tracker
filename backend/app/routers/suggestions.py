from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from datetime import datetime

from app.database import get_db
from app.models.suggestion import Suggestion
from app.models.recipe import Recipe
from app.dependencies import get_current_user
from app.services.suggestion_service import fetch_meal_suggestion
from app.utils.crypto import decrypt
from pydantic import BaseModel

router = APIRouter(prefix="/api/suggestions", tags=["suggestions"])

class FetchSuggestionRequest(BaseModel):
    meal_slot: str = "lunch"
    preferences: str = None

class SuggestionResponse(BaseModel):
    meal_name: str
    ingredients: list
    prep_time: int
    servings: int
    macros: dict

class ConvertToRecipeRequest(BaseModel):
    meal_name: str
    ingredients: list
    prep_time: int
    servings: int
    macros: dict

@router.post("/fetch", response_model=SuggestionResponse)
async def get_meal_suggestion(
    request: FetchSuggestionRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a new meal suggestion based on meal slot and preferences."""
    try:
        # Get and decrypt user's API key from database
        if not current_user.anthropic_api_key_encrypted:
            raise ValueError("User has not configured an Anthropic API key")
        
        api_key = decrypt(current_user.anthropic_api_key_encrypted)
        suggestion = fetch_meal_suggestion(api_key, request.meal_slot, request.preferences)
        
        # Store suggestion in DB
        db_suggestion = Suggestion(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            meal_name=suggestion["meal_name"],
            ingredients=suggestion["ingredients"],
            prep_time=suggestion["prep_time"],
            servings=suggestion["servings"],
            macros=suggestion["macros"]
        )
        db.add(db_suggestion)
        await db.commit()
        
        return suggestion
    except Exception as e:
        print(f"Error in fetch suggestion: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch suggestion: {str(e)}"
        )

@router.post("/convert-to-recipe")
async def convert_suggestion_to_recipe(
    data: ConvertToRecipeRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Convert a meal suggestion to a saved recipe."""
    try:
        new_recipe = Recipe(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            name=data.meal_name,
            ingredients=data.ingredients,
            prep_time=data.prep_time,
            servings=data.servings,
            macros=data.macros,
            created_at=datetime.utcnow()
        )
        db.add(new_recipe)
        await db.commit()
        await db.refresh(new_recipe)
        
        return {
            "id": new_recipe.id,
            "name": new_recipe.name,
            "created_at": new_recipe.created_at
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create recipe: {str(e)}"
        )
