import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, API_BASE } from '../context/AuthContext'
import CielitoLogo from '../components/CielitoLogo'
import Alert from '../components/Alert'
import { GoogleIcon, FacebookIcon, AppleIcon, handleOAuthLogin } from '../components/SocialAuth'

export default function RegisterPage() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [terms, setTerms] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const { saveSession } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAlert(null)

    if (!nombre.trim() || !email.trim() || !password) {
      setAlert({ message: 'Completa todos los campos.', type: 'error' })
      return
    }
    if (password.length < 6) {
      setAlert({ message: 'La contraseña debe tener al menos 6 caracteres.', type: 'error' })
      return
    }
    if (password !== confirm) {
      setAlert({ message: 'Las contraseñas no coinciden.', type: 'error' })
      return
    }
    if (!terms) {
      setAlert({ message: 'Debes aceptar los Términos y Política de privacidad.', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert({ message: data.error || 'Error al crear cuenta.', type: 'error' })
        return
      }
      saveSession(data.token, data.user)
      setAlert({ message: 'Cuenta creada exitosamente.', type: 'success' })
      setTimeout(() => navigate('/home'), 800)
    } catch {
      setAlert({ message: 'Error de conexión. Verifica que el servidor esté activo.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-body">
      <div className="auth-page">
        <Link to="/login" className="ch-back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>

        <div className="auth-logo-circle">
          <CielitoLogo size={60} strokeColor="#2D6A50" strokeWidth="2" />
          <span className="auth-logo-brand">Cielito Home</span>
        </div>

        <h2 className="auth-title">Crea tu Cuenta</h2>

        <Alert message={alert?.message} type={alert?.type} />

        <form className="ch-form" onSubmit={handleSubmit} noValidate>
          <div className="ch-input-group">
            <input type="text" placeholder="Nombre Completo" autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div className="ch-input-group">
            <input type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <p className="ch-subtitle">Ingresa tu contraseña</p>

          <div className="ch-input-group ch-input-icon">
            <input type={showPw ? 'text' : 'password'} placeholder="Contraseña" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            <button type="button" className="ch-eye-btn" onClick={() => setShowPw(!showPw)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
          </div>
          <div className="ch-input-group ch-input-icon">
            <input type={showConfirm ? 'text' : 'password'} placeholder="Repite tu Contraseña" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
            <button type="button" className="ch-eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
          </div>

          <label className="ch-checkbox">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} required />
            <span>Lei y Acepto <a href="#">Términos y Política de privacidad.</a></span>
          </label>

          <button type="submit" className="btn-ch-primary" disabled={loading}>
            {loading ? <span className="ch-spinner" /> : <span className="btn-text">Crear Cuenta</span>}
          </button>
        </form>

        <div className="ch-social-divider-label">Ingresa Con</div>

        <div className="ch-social-icons">
          <button type="button" className="btn-ch-icon" onClick={() => handleOAuthLogin('google', setAlert)}>
            <GoogleIcon />
          </button>
          <button type="button" className="btn-ch-icon" onClick={() => handleOAuthLogin('facebook', setAlert)}>
            <FacebookIcon />
          </button>
          <button type="button" className="btn-ch-icon" onClick={() => setAlert({ message: 'Login con Apple próximamente disponible.', type: 'error' })}>
            <AppleIcon />
          </button>
        </div>

        <p className="ch-switch">¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión.</Link></p>
      </div>
    </div>
  )
}
