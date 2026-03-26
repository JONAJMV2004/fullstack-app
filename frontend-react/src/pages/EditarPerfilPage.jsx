import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, API_BASE } from '../context/AuthContext'
import AppTopbar from '../components/AppTopbar'
import BottomNav from '../components/BottomNav'
import Alert from '../components/Alert'

export default function EditarPerfilPage() {
  const { user, token, authHeaders, saveSession } = useAuth()
  const navigate = useNavigate()
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [form, setForm] = useState({ nombre: '', telefono: '' })
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() })
        const data = await res.json()
        if (res.ok && data.user) {
          setCurrentUser(data.user)
          setForm({
            nombre: data.user.nombre || data.user.name || '',
            telefono: data.user.telefono || '',
          })
        }
      } catch {
        setAlert({ message: 'Error al cargar el perfil.', type: 'error' })
      } finally {
        setProfileLoading(false)
      }
    }
    loadProfile()
  }, [])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)

    if (!form.nombre.trim()) {
      setAlert({ message: 'El nombre no puede estar vacío.', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/users/${currentUser.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ name: form.nombre.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert({ message: data.error || 'Error al actualizar el perfil.', type: 'error' })
        return
      }
      saveSession(token, { ...user, name: form.nombre.trim(), nombre: form.nombre.trim() })
      setAlert({ message: 'Perfil actualizado correctamente.', type: 'success' })
    } catch {
      setAlert({ message: 'Error de conexión.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const initials = currentUser
    ? (currentUser.nombre || currentUser.name || 'U').charAt(0).toUpperCase()
    : 'U'

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
            <div className="profile-avatar-large">
              {currentUser?.avatar_url ? (
                <img src={currentUser.avatar_url} alt="Avatar" className="profile-avatar-img" />
              ) : (
                <span className="profile-avatar-initials">{initials}</span>
              )}
            </div>
            <h1 className="settings-page-title">Editar Perfil</h1>
            <p className="settings-page-desc">Actualiza tu información personal</p>
          </div>

          <Alert message={alert?.message} type={alert?.type} />

          {profileLoading ? (
            <div className="settings-loading">
              <span className="ch-spinner settings-spinner" />
            </div>
          ) : (
            <form className="settings-form" onSubmit={handleSubmit}>
              {/* Read-only email */}
              <div className="settings-input-group">
                <label htmlFor="email">Correo electrónico</label>
                <div className="settings-input-wrap">
                  <input
                    id="email"
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="input-disabled"
                  />
                  <div className="input-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  </div>
                </div>
                <span className="input-hint">El correo no se puede cambiar</span>
              </div>

              <div className="settings-input-group">
                <label htmlFor="nombre">Nombre completo</label>
                <div className="settings-input-wrap">
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={form.nombre}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </div>
              </div>

              {currentUser?.provider && (
                <div className="profile-provider-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  <span>Cuenta vinculada con <strong>{currentUser.provider}</strong></span>
                </div>
              )}

              <button type="submit" className="btn-ch-primary settings-submit-btn" disabled={loading}>
                {loading ? <span className="ch-spinner" /> : 'Guardar Cambios'}
              </button>
            </form>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
