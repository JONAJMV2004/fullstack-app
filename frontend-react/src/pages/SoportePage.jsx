import { useNavigate } from 'react-router-dom'
import AppTopbar from '../components/AppTopbar'
import BottomNav from '../components/BottomNav'

export default function SoportePage() {
  const navigate = useNavigate()

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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </div>
            <h1 className="settings-page-title">Soporte Técnico</h1>
            <p className="settings-page-desc">¿Necesitas ayuda? Estamos para servirte</p>
          </div>

          <div className="ajustes-menu-list">
            <button className="ajustes-menu-item" onClick={() => alert('FAQ próximamente.')}>
              <div className="ajustes-menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="ajustes-menu-text">
                <span className="ajustes-menu-label">Preguntas Frecuentes</span>
                <span className="ajustes-menu-desc">Resuelve tus dudas rápidamente</span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="ajustes-chevron"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <button className="ajustes-menu-item" onClick={() => alert('Función próximamente disponible.')}>
              <div className="ajustes-menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="ajustes-menu-text">
                <span className="ajustes-menu-label">Contactar con un técnico</span>
                <span className="ajustes-menu-desc">Chat en vivo con soporte</span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="ajustes-chevron"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <button className="ajustes-menu-item" onClick={() => { window.location.href = 'mailto:soporte@cielitohome.com' }}>
              <div className="ajustes-menu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="ajustes-menu-text">
                <span className="ajustes-menu-label">Enviar Email</span>
                <span className="ajustes-menu-desc">soporte@cielitohome.com</span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="ajustes-chevron"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>

          <div className="notification-footer" style={{ marginTop: 24 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
            <span>Tiempo de respuesta promedio: 24 horas</span>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
