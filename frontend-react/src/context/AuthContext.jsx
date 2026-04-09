import { createContext, useContext, useState, useCallback } from 'react'

function normalizeApiBase(value) {
  const trimmed = (value || '/api').trim().replace(/\/$/, '')
  if (trimmed === '') return '/api'
  if (trimmed === '/api' || trimmed.endsWith('/api')) return trimmed
  return `${trimmed}/api`
}

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE_URL)
const TOKEN_KEY = 'app_token'
const USER_KEY = 'app_user'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY))
    } catch {
      return null
    }
  })

  const saveSession = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const authHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }, [token])

  const value = {
    token,
    user,
    isLoggedIn: !!token,
    saveSession,
    clearSession,
    authHeaders,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { API_BASE }
