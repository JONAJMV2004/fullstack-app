import { createContext, useContext, useState, useCallback } from 'react'

function normalizeApiBase(value) {
  const fallback = '/api'
  const trimmed = (value || fallback).trim().replace(/\/$/, '')
  if (trimmed === '') return fallback

  // Accept ws/wss env values and convert them to http/https API origins.
  let normalized = trimmed
    .replace(/^ws:\/\//i, 'http://')
    .replace(/^wss:\/\//i, 'https://')

  if (normalized !== '/api' && !normalized.endsWith('/api')) {
    normalized = `${normalized}/api`
  }

  // Prevent mixed content on secure pages when env accidentally uses http.
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    normalized = normalized.replace(/^http:\/\//i, 'https://')
  }

  return normalized
}

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE_URL)
const TOKEN_KEY = 'app_token'
const USER_KEY = 'app_user'

const AuthContext = createContext(null)

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)
  } catch {
    return true
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (stored && isTokenExpired(stored)) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      return null
    }
    return stored
  })
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
