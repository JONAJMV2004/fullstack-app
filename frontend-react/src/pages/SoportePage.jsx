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
            <a
              className="ajustes-menu-item"
              href="https://wa.me/524497556167?text=Hola%2C%20necesito%20ayuda%20con%20un%20incidente%20en%20Cielito%20Home."
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <div className="ajustes-menu-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.534 5.859L.057 23.428a.75.75 0 0 0 .921.921l5.569-1.477A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 0 1-4.953-1.353l-.355-.21-3.683.976.993-3.585-.23-.368A9.725 9.725 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                </svg>
              </div>
              <div className="ajustes-menu-text">
                <span className="ajustes-menu-label">Chat en vivo</span>
                <span className="ajustes-menu-desc">Escríbenos por WhatsApp</span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="ajustes-chevron"><polyline points="9 18 15 12 9 6" /></svg>
            </a>
            <a
              className="ajustes-menu-item"
              href="mailto:soporte@cielitohome.com?subject=Reporte%20de%20incidente%20-%20Cielito%20Home&body=Hola%2C%20equipo%20de%20soporte%3A%0A%0ADescribo%20el%20incidente%20que%20ocurri%C3%B3%3A%0A%0A%0AFecha%3A%0ADetalle%3A%0A%0AGracias."
              style={{ textDecoration: 'none' }}
            >
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
            </a>
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
