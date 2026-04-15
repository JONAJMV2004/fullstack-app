import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth, API_BASE } from './AuthContext'

const NotificationContext = createContext(null)

// Derive Socket.IO URL from API_BASE (strip trailing /api)
function getSocketUrl() {
  const base = API_BASE.replace(/\/api$/, '')
  // If relative (/api → ''), connect to same origin
  return base || undefined
}

export function NotificationProvider({ children }) {
  const { token, isLoggedIn } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const socketRef = useRef(null)

  // ── Fetch initial data ───────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/notificaciones?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notificaciones || [])
      }
    } catch (err) {
      console.error('Error fetching notifications:', err.message)
    }
  }, [token])

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/notificaciones/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count || 0)
      }
    } catch (err) {
      console.error('Error fetching unread count:', err.message)
    }
  }, [token])

  // ── Socket.IO connection ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn || !token) {
      // Cleanup on logout
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setNotifications([])
      setUnreadCount(0)
      return
    }

    const socketUrl = getSocketUrl()
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    })

    socket.on('connect', () => {
      console.log('Socket.IO connected')
    })

    socket.on('notificacion:nueva', (notif) => {
      setNotifications(prev => [notif, ...prev])
      setUnreadCount(prev => prev + 1)
    })

    socket.on('connect_error', (err) => {
      console.warn('Socket.IO connection error:', err.message)
    })

    socketRef.current = socket

    // Fetch initial data
    fetchNotifications()
    fetchUnreadCount()

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [isLoggedIn, token, fetchNotifications, fetchUnreadCount])

  // ── Actions ──────────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/notificaciones/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, leida: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error marking as read:', err.message)
    }
  }, [token])

  const markAllAsRead = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/notificaciones/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, leida: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Error marking all as read:', err.message)
    }
  }, [token])

  const deleteNotification = useCallback(async (id) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/notificaciones/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setNotifications(prev => {
          const notif = prev.find(n => n.id === id)
          if (notif && !notif.leida) setUnreadCount(c => Math.max(0, c - 1))
          return prev.filter(n => n.id !== id)
        })
      }
    } catch (err) {
      console.error('Error deleting notification:', err.message)
    }
  }, [token])

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
