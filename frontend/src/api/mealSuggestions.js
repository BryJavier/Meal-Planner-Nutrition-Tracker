import api from './client'

export const mealSuggestionsAPI = {
  /** Returns an array of 3–5 suggestion objects */
  async fetchSuggestions(mealType = 'lunch', preferences = '') {
    const response = await api.post('/api/suggestions/fetch', {
      meal_slot: mealType,
      preferences: preferences || null,
    })
    return response.data   // array
  },

  /** Convert one suggestion to a saved recipe */
  async convertToRecipe(suggestion, servings) {
    const response = await api.post('/api/suggestions/convert-to-recipe', {
      meal_name: suggestion.meal_name,
      description: suggestion.description || null,
      instructions: suggestion.instructions || null,
      ingredients: suggestion.ingredients,   // full nutrition fields included
      prep_time: suggestion.prep_time,
      cook_time: suggestion.cook_time || null,
      servings,
      macros: suggestion.macros,
    })
    return response.data
  },
}
