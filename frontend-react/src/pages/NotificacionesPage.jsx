import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppTopbar from '../components/AppTopbar'
import BottomNav from '../components/BottomNav'
import Alert from '../components/Alert'

const NOTIFICATION_OPTIONS = [
  { id: 'promos', label: 'Promociones y ofertas', desc: 'Recibe avisos de descuentos y ofertas especiales', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> },
  { id: 'puntos', label: 'Puntos ganados', desc: 'Cuando acumules puntos por tus estancias', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> },
  { id: 'canjes', label: 'Canjes realizados', desc: 'Confirmación cuando canjees tus puntos', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> },
  { id: 'recordatorios', label: 'Recordatorios', desc: 'Recordatorios de puntos por vencer', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg> },
]

export default function NotificacionesPage() {
  const navigate = useNavigate()
  const [alert, setAlert] = useState(null)
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('notification_prefs')
      return saved ? JSON.parse(saved) : { promos: true, puntos: true, canjes: true, recordatorios: false }
    } catch {
      return { promos: true, puntos: true, canjes: true, recordatorios: false }
    }
  })

  function togglePref(id) {
    const updated = { ...prefs, [id]: !prefs[id] }
    setPrefs(updated)
    localStorage.setItem('notification_prefs', JSON.stringify(updated))
    setAlert({ message: 'Preferencias actualizadas.', type: 'success' })
  }

  return (
    <div className="app-body">
      <div className="app-page">
        <AppTopbar />

        <div className="inner-page-content">
          <button className="settings-back-btn" onClick={() => navigate('/ajustes')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><polyline points="15 18 9 12 15 6" /></svg>
            Ajustes
          </button>

          <div className="settings-page-header">
            <div className="settings-page-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            </div>
            <h1 className="settings-page-title">Notificaciones</h1>
            <p className="settings-page-desc">Elige qué notificaciones quieres recibir</p>
          </div>

          <Alert message={alert?.message} type={alert?.type} />

          <div className="notification-list">
            {NOTIFICATION_OPTIONS.map(opt => (
              <div key={opt.id} className="notification-item" onClick={() => togglePref(opt.id)}>
                <div className="notification-item-icon">{opt.icon}</div>
                <div className="notification-item-info">
                  <p className="notification-item-label">{opt.label}</p>
                  <p className="notification-item-desc">{opt.desc}</p>
                </div>
                <label className="toggle-switch" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={prefs[opt.id]}
                    onChange={() => togglePref(opt.id)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            ))}
          </div>

          <div className="notification-footer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
            <span>Las notificaciones se envían al correo asociado a tu cuenta</span>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
