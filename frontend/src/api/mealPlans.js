import client from './client'

export const listPlans = (params) => client.get('/api/meal-plans', { params })
export const createPlan = (data) => client.post('/api/meal-plans', data)
export const getPlan = (id) => client.get(`/api/meal-plans/${id}`)
export const deletePlan = (id) => client.delete(`/api/meal-plans/${id}`)
export const addEntry = (planId, data) => client.post(`/api/meal-plans/${planId}/entries`, data)
export const updateEntry = (planId, entryId, data) => client.patch(`/api/meal-plans/${planId}/entries/${entryId}`, data)
export const deleteEntry = (planId, entryId) => client.delete(`/api/meal-plans/${planId}/entries/${entryId}`)
