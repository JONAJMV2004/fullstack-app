import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, API_BASE } from '../context/AuthContext'
import CielitoLogo from '../components/CielitoLogo'
import Alert from '../components/Alert'
import { GoogleIcon, FacebookIcon, AppleIcon, handleOAuthLogin } from '../components/SocialAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const { saveSession } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAlert(null)

    if (!email.trim() || !password) {
      setAlert({ message: 'Completa todos los campos.', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert({ message: data.error || 'Error al iniciar sesión.', type: 'error' })
        return
      }
      saveSession(data.token, data.user)
      setAlert({ message: 'Bienvenido de vuelta.', type: 'success' })
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
        <Link to="/" className="ch-back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>

        <div className="auth-logo-circle">
          <CielitoLogo size={64} strokeColor="#2D6A50" strokeWidth="2" />
        </div>

        <h2 className="auth-title">Ingresa tus datos</h2>

        <Alert message={alert?.message} type={alert?.type} />

        <form className="ch-form" onSubmit={handleSubmit} noValidate>
          <div className="ch-input-group">
            <input
              type="email"
              placeholder="Correo electrónico"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="ch-input-group ch-input-icon">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Contraseña"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className="ch-eye-btn" onClick={() => setShowPw(!showPw)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
          </div>

          <button type="submit" className="btn-ch-primary" disabled={loading}>
            {loading ? <span className="ch-spinner" /> : <span className="btn-text">Iniciar Sesión</span>}
          </button>
        </form>

        <a href="#" className="ch-link-center">Restablecer contraseña</a>

        <div className="ch-social-divider" />

        <div className="ch-social-list">
          <button type="button" className="btn-ch-social" onClick={() => handleOAuthLogin('google', setAlert)}>
            <GoogleIcon /> INGRESA CON GOOGLE
          </button>
          <button type="button" className="btn-ch-social" onClick={() => handleOAuthLogin('facebook', setAlert)}>
            <FacebookIcon /> INGRESA CON FACEBOOK
          </button>
          <button type="button" className="btn-ch-social" onClick={() => setAlert({ message: 'Login con Apple próximamente disponible.', type: 'error' })}>
            <AppleIcon /> INGRESA CON APPLE
          </button>
        </div>

        <p className="ch-terms">
          Al registrarte en Cielito Home, aceptas nuestros <a href="#">Términos y Política de privacidad.</a>
        </p>
      </div>
    </div>
  )
}
