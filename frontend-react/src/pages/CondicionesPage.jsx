import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppTopbar from '../components/AppTopbar'
import BottomNav from '../components/BottomNav'

const SECTIONS = [
  {
    id: 'datos',
    title: 'Cómo protegemos tus datos',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    content: 'Implementamos medidas de seguridad estándar de la industria para proteger tu información personal. Todos los datos se transmiten mediante conexiones cifradas (SSL/TLS) y se almacenan de forma segura en servidores protegidos.',
  },
  {
    id: 'canjes',
    title: 'Condiciones en Canje de Puntos',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    content: 'Los puntos acumulados pueden canjearse por los premios disponibles en la sección de Recompensas. Los puntos no tienen valor monetario y no son transferibles. Nos reservamos el derecho de modificar el catálogo de premios sin previo aviso.',
  },
  {
    id: 'privacidad',
    title: 'Política de privacidad',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    content: 'Recopilamos únicamente la información necesaria para operar el programa de lealtad: nombre, correo electrónico y datos de estancias. No compartimos tu información con terceros sin tu consentimiento expreso. Puedes solicitar la eliminación de tus datos en cualquier momento desde la sección de Ajustes.',
  },
]

export default function CondicionesPage() {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(null)

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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            </div>
            <h1 className="settings-page-title">Términos y Condiciones</h1>
            <p className="settings-page-desc">Última actualización: Marzo 2026</p>
          </div>

          <div className="accordion-list">
            {SECTIONS.map(section => (
              <div key={section.id} className={`accordion-item ${expanded === section.id ? 'accordion-item--open' : ''}`}>
                <button
                  className="accordion-header"
                  onClick={() => setExpanded(expanded === section.id ? null : section.id)}
                >
                  <div className="accordion-header-left">
                    <div className="accordion-icon">{section.icon}</div>
                    <span className="accordion-title">{section.title}</span>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className={`accordion-chevron ${expanded === section.id ? 'accordion-chevron--open' : ''}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {expanded === section.id && (
                  <div className="accordion-body">
                    <p>{section.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
