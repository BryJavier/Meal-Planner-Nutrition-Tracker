import { Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Spin } from 'antd'
import useAuthStore from '../../store/authStore'
import { getMe } from '../../api/auth'

export default function ProtectedRoute() {
  const { token, setUser, logout } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    getMe()
      .then(({ data }) => setUser(data))
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <Spin fullscreen />
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}
