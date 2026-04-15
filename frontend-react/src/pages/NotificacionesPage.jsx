import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppTopbar from '../components/AppTopbar'
import BottomNav from '../components/BottomNav'
import { useNotifications } from '../context/NotificationContext'

const TIPO_ICON = {
  puntos: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  canje: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  estancia: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  promo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
  sistema: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
  general: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `Hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

export default function NotificacionesPage() {
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.leida)
    : notifications

  return (
    <div className="app-body">
      <div className="app-page">
        <AppTopbar />

        <div className="inner-page-content">
          <button className="settings-back-btn" onClick={() => navigate('/home')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><polyline points="15 18 9 12 15 6" /></svg>
            Inicio
          </button>

          <div className="settings-page-header">
            <div className="settings-page-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            </div>
            <h1 className="settings-page-title">Notificaciones</h1>
            <p className="settings-page-desc">
              {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
            </p>
          </div>

          {/* Filtros + marcar todas */}
          <div className="notif-actions-bar">
            <div className="notif-filter-tabs">
              <button
                className={`notif-filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Todas
              </button>
              <button
                className={`notif-filter-tab ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                Sin leer
              </button>
            </div>
            {unreadCount > 0 && (
              <button className="notif-mark-all-btn" onClick={markAllAsRead}>
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* Lista de notificaciones */}
          {filtered.length === 0 ? (
            <div className="notif-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ opacity: 0.3 }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <p>{filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}</p>
            </div>
          ) : (
            <div className="notif-feed">
              {filtered.map(notif => (
                <div
                  key={notif.id}
                  className={`notif-card ${!notif.leida ? 'notif-unread' : ''}`}
                  onClick={() => !notif.leida && markAsRead(notif.id)}
                >
                  <div className="notif-card-icon">
                    {TIPO_ICON[notif.tipo] || TIPO_ICON.general}
                  </div>
                  <div className="notif-card-body">
                    <div className="notif-card-header">
                      <span className="notif-card-title">{notif.titulo}</span>
                      <span className="notif-card-time">{timeAgo(notif.created_at)}</span>
                    </div>
                    {notif.mensaje && (
                      <p className="notif-card-msg">{notif.mensaje}</p>
                    )}
                  </div>
                  <button
                    className="notif-card-delete"
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id) }}
                    aria-label="Eliminar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
