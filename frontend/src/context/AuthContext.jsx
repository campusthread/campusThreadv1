import { createContext, useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import apiClient from '../utils/api'
import { clearCredentials, setCredentials } from '../redux/slices/authSlice'
import {
  useLazyGetCurrentUserQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
} from '../redux/slices/authApiSlice'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [triggerCurrentUser] = useLazyGetCurrentUserQuery()
  const [registerMutation] = useRegisterMutation()
  const [loginMutation] = useLoginMutation()
  const [logoutMutation] = useLogoutMutation()

  // Check if user is already logged in on mount
  const getStoredUser = () => {
    try {
      const stored = localStorage.getItem('currentUser')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  const saveStoredUser = (userData, token) => {
    try {
      localStorage.setItem('currentUser', JSON.stringify(userData))
      if (token) {
        localStorage.setItem('accessToken', token)
      }
    } catch {
      // ignore storage errors
    }
  }

  const syncAuthenticatedState = (userData, token = localStorage.getItem('accessToken')) => {
    if (token) {
      apiClient.setToken(token)
    }

    dispatch(
      setCredentials({
        user: userData,
        token: token || null,
      }),
    )
    saveStoredUser(userData, token)
  }

  const clearAuthenticatedState = () => {
    apiClient.clearToken()
    dispatch(clearCredentials())
    localStorage.removeItem('currentUser')
    localStorage.removeItem('accessToken')
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await triggerCurrentUser().unwrap()
        if (response.success) {
          syncAuthenticatedState(response.user)
          return
        }
      } catch (err) {
        // fallback to local storage when backend is unavailable
      }

      const fallbackUser = getStoredUser()
      if (fallbackUser) {
        syncAuthenticatedState(fallbackUser)
      } else {
        clearAuthenticatedState()
      }
    }

    checkAuth().finally(() => setIsLoading(false))
  }, [triggerCurrentUser])

  useEffect(() => {
    const handleAuthUpdate = () => {
      const storedUser = getStoredUser()
      if (storedUser) {
        syncAuthenticatedState(storedUser)
      } else {
        clearAuthenticatedState()
      }
    }

    window.addEventListener('campusThreadAuthUpdate', handleAuthUpdate)
    return () => window.removeEventListener('campusThreadAuthUpdate', handleAuthUpdate)
  }, [])

  const register = async (data) => {
    try {
      setError(null)
      const response = await registerMutation(data).unwrap()
      if (response.success) {
        const user = response.user || null
        const token = response.token || null
        syncAuthenticatedState(user, token)
        return response
      }
    } catch (err) {
      const errorMsg = err.message || 'Registration failed'
      setError(errorMsg)
      throw err
    }
  }

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await loginMutation({ email, password }).unwrap()
      if (response.success) {
        const user = response.user || null
        const token = response.token || null
        syncAuthenticatedState(user, token)
        return response
      }
    } catch (err) {
      const errorMsg = err.message || 'Login failed'
      setError(errorMsg)
      throw err
    }
  }

  const logout = async () => {
    try {
      await logoutMutation().unwrap()
    } catch (err) {
      // Ignore logout failures when offline or backend is unavailable
    }
    clearAuthenticatedState()
    setError(null)
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    register,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
