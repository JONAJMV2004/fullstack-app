import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CielitoLogo from './CielitoLogo'

export default function SideMenu() {
  const [open, setOpen] = useState(false)
  const { clearSession } = useAuth()
  const location = useLocation()

  const currentPage = location.pathname.replace('/', '')

  const menuItems = [
    { path: '/acerca', label: 'Acerca de', page: 'acerca', icon: <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="8" stroke="white" strokeWidth="2" strokeLinecap="round" /><line x1="12" y1="12" x2="12" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg> },
    { path: '/ajustes', label: 'Ajustes', page: 'ajustes', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" /></svg> },
    { path: '/soporte', label: 'Soporte Técnico', page: 'soporte', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
    { path: '/condiciones', label: 'Términos y Condiciones', page: 'condiciones', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> },
  ]

  const handleLogout = (e) => {
    e.preventDefault()
    clearSession()
  }

  return (
    <>
      <button className="menu-btn" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && <div className="menu-overlay" onClick={() => setOpen(false)} />}

      <aside className={`side-menu ${open ? '' : 'hidden'}`}>
        <div className="side-menu-header">
          <button className="menu-close-btn" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="side-menu-logo-wrap">
          <div className="app-logo-circle" style={{ margin: '0 auto 12px', width: 80, height: 80 }}>
            <CielitoLogo size={42} />
            <span>Cielito Home</span>
          </div>
        </div>
        <h2 className="side-menu-question">¿Que necesitas hoy?</h2>
        <nav className="side-menu-nav">
          {menuItems.map((item) => (
            <Link
              key={item.page}
              to={item.path}
              className={`side-menu-item ${currentPage === item.page ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          <a href="#" className="side-menu-item" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar Sesión
          </a>
        </nav>
      </aside>
    </>
  )
}
