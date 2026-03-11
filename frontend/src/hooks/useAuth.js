import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { login as apiLogin, fetchMe } from '../api/auth'

export function useAuth() {
  const { token, user, setToken, setUser, logout: storeLogout } = useAuthStore()
  const navigate = useNavigate()

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password)
    setToken(data.access_token)
    const me = await fetchMe(data.access_token)
    setUser(me)
    navigate('/dashboard')
  }, [setToken, setUser, navigate])

  const logout = useCallback(() => {
    storeLogout()
    navigate('/login')
  }, [storeLogout, navigate])

  return { token, user, login, logout, isAuthenticated: !!token }
}
