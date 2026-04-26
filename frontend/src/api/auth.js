import client from './client'

export const register = (data) => client.post('/api/auth/register', data)
export const login = (data) => client.post('/api/auth/login', data)
export const getMe = () => client.get('/api/auth/me')
export const updateMe = (data) => client.patch('/api/auth/me', data)
export const changePassword = (data) => client.post('/api/auth/me/change-password', data)
export const updateApiKey = (data) => client.put('/api/auth/me/api-key', data)
