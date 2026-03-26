import { useNavigate } from 'react-router-dom'
import AppTopbar, { AppLogoCircle } from '../components/AppTopbar'
import BottomNav from '../components/BottomNav'

export default function AcercaPage() {
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
            <AppLogoCircle />
            <h1 className="settings-page-title">Acerca de</h1>
            <p className="settings-page-desc">Cielito Home - Programa de Lealtad</p>
          </div>

          <div className="acerca-card">
            <div className="acerca-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </div>
            <h2 className="acerca-card-title">Cielito Home</h2>
            <p className="acerca-card-text">
              Somos una empresa dedicada a brindarte experiencias únicas a la carta. Nuestro programa de lealtad te permite acumular puntos con cada estancia y canjearlos por increíbles beneficios.
            </p>
          </div>

          <div className="acerca-card">
            <div className="acerca-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            </div>
            <h2 className="acerca-card-title">Nuestra misión</h2>
            <p className="acerca-card-text">
              Hacer que cada estadía sea una experiencia memorable, recompensando tu preferencia con puntos que se convierten en beneficios reales para ti.
            </p>
          </div>

          <div className="acerca-info-row">
            <div className="acerca-info-item">
              <span className="acerca-info-label">Versión</span>
              <span className="acerca-info-value">1.0.0</span>
            </div>
            <div className="acerca-info-item">
              <span className="acerca-info-label">Plataforma</span>
              <span className="acerca-info-value">Web App</span>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
