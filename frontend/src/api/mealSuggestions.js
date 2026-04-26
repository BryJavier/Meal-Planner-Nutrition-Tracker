import api from './client'

export const mealSuggestionsAPI = {
  async fetchSuggestion(mealType = 'lunch', preferences = '') {
    const response = await api.post('/api/suggestions/fetch', {
      meal_slot: mealType,
      preferences: preferences || null
    })
    return response.data
  },

  async convertToRecipe(suggestion, servings) {
    const response = await api.post('/api/suggestions/convert-to-recipe', {
      meal_name: suggestion.meal_name,
      ingredients: suggestion.ingredients,
      prep_time: suggestion.prep_time,
      servings: servings,
      macros: suggestion.macros
    })
    return response.data
  }
}
