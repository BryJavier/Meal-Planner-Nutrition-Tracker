import client from './client'

export const listRecipes = (params) => client.get('/api/recipes', { params })
export const createRecipe = (data) => client.post('/api/recipes', data)
export const getRecipe = (id) => client.get(`/api/recipes/${id}`)
export const updateRecipe = (id, data) => client.patch(`/api/recipes/${id}`, data)
export const deleteRecipe = (id) => client.delete(`/api/recipes/${id}`)

export const listIngredients = (params) => client.get('/api/ingredients', { params })
export const createIngredient = (data) => client.post('/api/ingredients', data)
export const updateIngredient = (id, data) => client.patch(`/api/ingredients/${id}`, data)
export const deleteIngredient = (id) => client.delete(`/api/ingredients/${id}`)
