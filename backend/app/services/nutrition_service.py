from app.models.recipe import Recipe
from app.schemas.recipe import MacroRead


def compute_recipe_macros(recipe: Recipe, servings: float = 1.0) -> MacroRead:
    total_calories = total_protein = total_carbs = total_fat = 0.0
    for ri in recipe.recipe_ingredients:
        ing = ri.ingredient
        factor = ri.quantity_g / 100.0
        total_calories += ing.calories_per_100g * factor
        total_protein += ing.protein_per_100g * factor
        total_carbs += ing.carbs_per_100g * factor
        total_fat += ing.fat_per_100g * factor

    per_serving = recipe.servings or 1
    return MacroRead(
        calories=round(total_calories / per_serving * servings, 1),
        protein_g=round(total_protein / per_serving * servings, 1),
        carbs_g=round(total_carbs / per_serving * servings, 1),
        fat_g=round(total_fat / per_serving * servings, 1),
    )
