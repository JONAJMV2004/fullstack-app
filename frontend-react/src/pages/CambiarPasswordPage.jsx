import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, API_BASE } from '../context/AuthContext'
import AppTopbar, { AppLogoCircle } from '../components/AppTopbar'
import BottomNav from '../components/BottomNav'
import Alert from '../components/Alert'

export default function CambiarPasswordPage() {
  const { authHeaders } = useAuth()
  const navigate = useNavigate()
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setAlert({ message: 'Todos los campos son requeridos.', type: 'error' })
      return
    }
    if (form.newPassword.length < 6) {
      setAlert({ message: 'La nueva contraseña debe tener al menos 6 caracteres.', type: 'error' })
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setAlert({ message: 'Las contraseñas no coinciden.', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/update-password`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert({ message: data.error || 'Error al cambiar la contraseña.', type: 'error' })
        return
      }
      setAlert({ message: 'Contraseña actualizada correctamente.', type: 'success' })
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch {
      setAlert({ message: 'Error de conexión.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const EyeIcon = ({ open }) => open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
  )

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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>
            <h1 className="settings-page-title">Cambiar Contraseña</h1>
            <p className="settings-page-desc">Actualiza tu contraseña para mantener tu cuenta segura</p>
          </div>

          <Alert message={alert?.message} type={alert?.type} />

          <form className="settings-form" onSubmit={handleSubmit}>
            <div className="settings-input-group">
              <label htmlFor="currentPassword">Contraseña actual</label>
              <div className="settings-input-wrap">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña actual"
                  value={form.currentPassword}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button type="button" className="settings-eye-btn" onClick={() => setShowCurrent(!showCurrent)}>
                  <EyeIcon open={showCurrent} />
                </button>
              </div>
            </div>

            <div className="settings-input-group">
              <label htmlFor="newPassword">Nueva contraseña</label>
              <div className="settings-input-wrap">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNew ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={form.newPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button type="button" className="settings-eye-btn" onClick={() => setShowNew(!showNew)}>
                  <EyeIcon open={showNew} />
                </button>
              </div>
              {form.newPassword && (
                <div className="password-strength">
                  <div className={`strength-bar ${form.newPassword.length >= 10 ? 'strong' : form.newPassword.length >= 6 ? 'medium' : 'weak'}`} />
                  <span className="strength-label">
                    {form.newPassword.length >= 10 ? 'Fuerte' : form.newPassword.length >= 6 ? 'Media' : 'Débil'}
                  </span>
                </div>
              )}
            </div>

            <div className="settings-input-group">
              <label htmlFor="confirmPassword">Confirmar nueva contraseña</label>
              <div className="settings-input-wrap">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repite la nueva contraseña"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button type="button" className="settings-eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </div>

            <button type="submit" className="btn-ch-primary settings-submit-btn" disabled={loading}>
              {loading ? <span className="ch-spinner" /> : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
