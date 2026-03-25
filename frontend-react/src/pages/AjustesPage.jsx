import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, API_BASE } from '../context/AuthContext'
import AppTopbar from '../components/AppTopbar'
import BottomNav from '../components/BottomNav'
import Alert from '../components/Alert'

export default function AjustesPage() {
  const { token, clearSession, authHeaders } = useAuth()
  const [alert, setAlert] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() })
        const data = await res.json()
        if (res.ok) setCurrentUser(data.user)
      } catch { /* silent */ }
    }
    loadProfile()
  }, [])

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json()
        setAlert({ message: data.error || 'Error al eliminar cuenta.', type: 'error' })
        setShowDeleteModal(false)
        return
      }
      clearSession()
    } catch {
      setAlert({ message: 'Error de conexión.', type: 'error' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const nombre = currentUser?.nombre || currentUser?.name || user?.name || '—'
  const email = currentUser?.email || user?.email || ''
  const initials = nombre !== '—' ? nombre.charAt(0).toUpperCase() : 'U'

  return (
    <div className="app-body">
      <div className="app-page">
        <AppTopbar />

        <div className="inner-page-content">
          {/* Profile header card */}
          <div className="ajustes-profile-card">
            <div className="ajustes-avatar">
              {currentUser?.avatar_url ? (
                <img src={currentUser.avatar_url} alt="Avatar" className="ajustes-avatar-img" />
              ) : (
                <span className="ajustes-avatar-initials">{initials}</span>
              )}
            </div>
            <div className="ajustes-profile-info">
              <h2 className="ajustes-profile-name">{nombre}</h2>
              <p className="ajustes-profile-email">{email}</p>
            </div>
            <button className="ajustes-edit-btn" onClick={() => navigate('/editar-perfil')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            </button>
          </div>

          <Alert message={alert?.message} type={alert?.type} />

          {/* Account section */}
          <div className="ajustes-section">
            <h3 className="ajustes-section-title">Cuenta</h3>
            <div className="ajustes-menu-list">
              <button className="ajustes-menu-item" onClick={() => navigate('/editar-perfil')}>
                <div className="ajustes-menu-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
                <div className="ajustes-menu-text">
                  <span className="ajustes-menu-label">Editar Perfil</span>
                  <span className="ajustes-menu-desc">Nombre, foto e información</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="ajustes-chevron"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              <button className="ajustes-menu-item" onClick={() => navigate('/cambiar-password')}>
                <div className="ajustes-menu-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <div className="ajustes-menu-text">
                  <span className="ajustes-menu-label">Cambiar Contraseña</span>
                  <span className="ajustes-menu-desc">Actualiza tu contraseña</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="ajustes-chevron"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              <button className="ajustes-menu-item" onClick={() => navigate('/notificaciones')}>
                <div className="ajustes-menu-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                </div>
                <div className="ajustes-menu-text">
                  <span className="ajustes-menu-label">Notificaciones</span>
                  <span className="ajustes-menu-desc">Configura tus alertas</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="ajustes-chevron"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>

          {/* Preferences section */}
          <div className="ajustes-section">
            <h3 className="ajustes-section-title">Preferencias</h3>
            <div className="ajustes-menu-list">
              <button className="ajustes-menu-item" onClick={() => setAlert({ message: 'Cambio de idioma próximamente disponible.', type: 'error' })}>
                <div className="ajustes-menu-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                </div>
                <div className="ajustes-menu-text">
                  <span className="ajustes-menu-label">Idioma</span>
                  <span className="ajustes-menu-desc">Español</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="ajustes-chevron"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              <button className="ajustes-menu-item" onClick={() => setAlert({ message: 'Cambio de tema próximamente disponible.', type: 'error' })}>
                <div className="ajustes-menu-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                </div>
                <div className="ajustes-menu-text">
                  <span className="ajustes-menu-label">Tema</span>
                  <span className="ajustes-menu-desc">Claro</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="ajustes-chevron"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>

          {/* Support section */}
          <div className="ajustes-section">
            <h3 className="ajustes-section-title">Ayuda</h3>
            <div className="ajustes-menu-list">
              <button className="ajustes-menu-item" onClick={() => navigate('/soporte')}>
                <div className="ajustes-menu-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </div>
                <div className="ajustes-menu-text">
                  <span className="ajustes-menu-label">Soporte Técnico</span>
                  <span className="ajustes-menu-desc">FAQ, contacto y reportar errores</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="ajustes-chevron"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              <button className="ajustes-menu-item" onClick={() => navigate('/acerca')}>
                <div className="ajustes-menu-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                </div>
                <div className="ajustes-menu-text">
                  <span className="ajustes-menu-label">Acerca de</span>
                  <span className="ajustes-menu-desc">Información de la app v1.0.0</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="ajustes-chevron"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              <button className="ajustes-menu-item" onClick={() => navigate('/condiciones')}>
                <div className="ajustes-menu-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                </div>
                <div className="ajustes-menu-text">
                  <span className="ajustes-menu-label">Términos y Condiciones</span>
                  <span className="ajustes-menu-desc">Políticas de privacidad</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="ajustes-chevron"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="ajustes-section">
            <h3 className="ajustes-section-title ajustes-section-title--danger">Zona de peligro</h3>
            <div className="ajustes-menu-list">
              <button className="ajustes-menu-item ajustes-menu-item--danger" onClick={() => setShowDeleteModal(true)}>
                <div className="ajustes-menu-icon ajustes-menu-icon--danger">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                </div>
                <div className="ajustes-menu-text">
                  <span className="ajustes-menu-label">Eliminar Cuenta</span>
                  <span className="ajustes-menu-desc">Elimina permanentemente tu cuenta y datos</span>
                </div>
              </button>
            </div>
          </div>

          <button className="ajustes-logout-btn" onClick={clearSession}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Cerrar Sesión
          </button>

          <p className="ajustes-version">Cielito Home v1.0.0</p>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}>
          <div className="modal-card">
            <div className="modal-icon-danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            </div>
            <h3 className="modal-title">¿Eliminar cuenta?</h3>
            <p className="modal-desc">Esta acción es permanente y no se puede deshacer. Se eliminarán todos tus puntos, estancias y datos personales.</p>
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className="btn-ch-primary modal-confirm-btn btn-danger" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? <span className="ch-spinner" /> : <span className="btn-text">Eliminar</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
