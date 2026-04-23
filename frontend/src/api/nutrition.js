import client from './client'

export const getDailyNutrition = (date) => client.get('/api/nutrition/daily', { params: { date } })
export const getWeeklyNutrition = (weekStart) => client.get('/api/nutrition/weekly', { params: { week_start: weekStart } })
export const getNutritionSummary = () => client.get('/api/nutrition/summary')
