import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, API_BASE } from '../context/AuthContext'
import CielitoLogo from '../components/CielitoLogo'
import Alert from '../components/Alert'
import { GoogleIcon, FacebookIcon, InstagramIcon, handleOAuthLogin, handleFacebookSdkLogin } from '../components/SocialAuth'

const PWA_NEW_USER_KEY = 'pwa_prompt_new_user'

export default function RegisterPage() {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [terms, setTerms] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [step, setStep] = useState(1)
  const [code, setCode] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const { saveSession } = useAuth()
  const navigate = useNavigate()

  function startCooldown() {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAlert(null)

    if (!nombre.trim() || !telefono.trim() || !email.trim() || !password) {
      setAlert({ message: 'Completa todos los campos.', type: 'error' })
      return
    }
    if (telefono.trim().length < 8) {
      setAlert({ message: 'Ingresa un celular valido.', type: 'error' })
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
        body: JSON.stringify({
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          email: email.trim(),
          password,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert({ message: data.error || 'Error al crear cuenta.', type: 'error' })
        return
      }
      setAlert({ message: `Código enviado a ${email.trim()}`, type: 'success' })
      setStep(2)
      startCooldown()
    } catch {
      setAlert({ message: 'Error de conexión. Verifica que el servidor esté activo.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setAlert(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          email: email.trim(),
          password,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert({ message: data.error || 'Error al reenviar.', type: 'error' })
        return
      }
      setAlert({ message: 'Nuevo código enviado.', type: 'success' })
      startCooldown()
    } catch {
      setAlert({ message: 'Error de conexión.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setAlert(null)
    if (!code.trim()) {
      setAlert({ message: 'Ingresa el código de verificación.', type: 'error' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/verify-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), verificationCode: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert({ message: data.error || 'Código incorrecto.', type: 'error' })
        return
      }
      if (data?.user?.id) {
        localStorage.setItem(PWA_NEW_USER_KEY, String(data.user.id))
      }
      saveSession(data.token, data.user)
      setAlert({ message: 'Cuenta creada exitosamente.', type: 'success' })
      setTimeout(() => navigate('/home'), 800)
    } catch {
      setAlert({ message: 'Error de conexión.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (step === 2) {
    return (
      <div className="auth-body">
        <div className="auth-page">
          <button type="button" className="ch-back-btn" onClick={() => { setStep(1); setCode(''); setAlert(null) }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="auth-logo-circle">
            <CielitoLogo size={60} strokeColor="#2D6A50" strokeWidth="2" />
            <span className="auth-logo-brand">Cielito Home</span>
          </div>

          <h2 className="auth-title">Verifica tu Correo</h2>
          <p className="ch-subtitle" style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            Enviamos un código de 6 dígitos a<br /><strong>{email.trim()}</strong>
          </p>

          <Alert message={alert?.message} type={alert?.type} />

          <form className="ch-form" onSubmit={handleVerify} noValidate>
            <div className="ch-input-group">
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                style={{ letterSpacing: '0.4em', textAlign: 'center', fontSize: '1.4rem', fontWeight: 700 }}
                required
              />
            </div>

            <button type="submit" className="btn-ch-primary" disabled={loading}>
              {loading ? <span className="ch-spinner" /> : <span className="btn-text">Activar Cuenta</span>}
            </button>
          </form>

          <p className="ch-switch" style={{ marginTop: '1rem' }}>
            ¿No llegó el correo?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || loading}
              style={{ background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'default' : 'pointer', color: resendCooldown > 0 ? '#a0aec0' : '#2D6A50', fontWeight: 600, padding: 0, fontSize: 'inherit' }}
            >
              {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
            </button>
          </p>
        </div>
      </div>
    )
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
            <input type="tel" placeholder="Celular" autoComplete="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
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
          <button
            type="button"
            className="btn-ch-icon"
            onClick={() => handleFacebookSdkLogin({
              setAlert,
              saveSession,
              onNewUser: (userId) => localStorage.setItem(PWA_NEW_USER_KEY, String(userId)),
              onSuccess: () => setTimeout(() => navigate('/home'), 600),
            })}
          >
            <FacebookIcon />
          </button>
          <button type="button" className="btn-ch-icon" onClick={() => setAlert({ message: 'Instagram login estara disponible pronto.', type: 'error' })}>
            <InstagramIcon />
          </button>
        </div>

        <p className="ch-switch">¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión.</Link></p>
      </div>
    </div>
  )
}
