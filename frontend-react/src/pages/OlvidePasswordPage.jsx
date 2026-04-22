import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { API_BASE } from '../context/AuthContext'
import CielitoLogo from '../components/CielitoLogo'
import Alert from '../components/Alert'

export default function OlvidePasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1 = ingresar email, 2 = código + nueva contraseña
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  function startResendCooldown() {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  async function handleSendCode(e) {
    e.preventDefault()
    setAlert(null)
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setAlert({ message: 'Ingresa tu correo electrónico.', type: 'error' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert({ message: data.error || 'Error al enviar el código.', type: 'error' })
        return
      }
      setAlert({ message: data.message, type: 'success' })
      setCode('')
      setNewPassword('')
      setConfirmPassword('')
      setStep(2)
      startResendCooldown()
    } catch {
      setAlert({ message: 'Error de conexión.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setAlert(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert({ message: data.error || 'Error al reenviar el código.', type: 'error' })
        return
      }
      setAlert({ message: 'Código reenviado a tu correo.', type: 'success' })
      setCode('')
      startResendCooldown()
    } catch {
      setAlert({ message: 'Error de conexión.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setAlert(null)
    if (!code.trim()) {
      setAlert({ message: 'Ingresa el código de verificación.', type: 'error' })
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setAlert({ message: 'La nueva contraseña debe tener al menos 6 caracteres.', type: 'error' })
      return
    }
    if (newPassword !== confirmPassword) {
      setAlert({ message: 'Las contraseñas no coinciden.', type: 'error' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          verificationCode: code.trim(),
          newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert({ message: data.error || 'Error al restablecer la contraseña.', type: 'error' })
        return
      }
      setAlert({ message: data.message, type: 'success' })
      setTimeout(() => navigate('/login'), 2000)
    } catch {
      setAlert({ message: 'Error de conexión.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const EyeOpen = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
  const EyeClosed = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )

  if (step === 2) {
    return (
      <div className="auth-body">
        <div className="auth-page">
          <button type="button" className="ch-back-btn" onClick={() => { setStep(1); setAlert(null) }}>
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

          <form className="ch-form" onSubmit={handleReset} noValidate>
            <div className="ch-input-group">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                autoComplete="one-time-code"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ letterSpacing: '0.4em', textAlign: 'center', fontSize: '1.4rem', fontWeight: 700 }}
                required
              />
            </div>

            <p style={{ fontSize: '0.78rem', color: '#718096', textAlign: 'center', margin: '-4px 0' }}>
              El código expira en 10 minutos. Revisa también la carpeta de spam.
            </p>

            <p className="ch-subtitle">Nueva contraseña</p>

            <div className="ch-input-group ch-input-icon">
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <button type="button" className="ch-eye-btn" onClick={() => setShowNew(!showNew)}>
                {showNew ? <EyeOpen /> : <EyeClosed />}
              </button>
            </div>

            <div className="ch-input-group ch-input-icon">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repite la nueva contraseña"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              <button type="button" className="ch-eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOpen /> : <EyeClosed />}
              </button>
            </div>

            <button type="submit" className="btn-ch-primary" disabled={loading || code.length < 6}>
              {loading ? <span className="ch-spinner" /> : <span className="btn-text">Restablecer contraseña</span>}
            </button>
          </form>

          <p className="ch-switch" style={{ marginTop: '1rem' }}>
            ¿No llegó el correo?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || loading}
              style={{
                background: 'none', border: 'none', padding: 0, fontSize: 'inherit',
                fontWeight: 600, cursor: resendCooldown > 0 ? 'default' : 'pointer',
                color: resendCooldown > 0 ? '#a0aec0' : '#2D6A50',
              }}
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
          <CielitoLogo size={64} strokeColor="#2D6A50" strokeWidth="2" />
        </div>

        <h2 className="auth-title">Restablecer contraseña</h2>

        <Alert message={alert?.message} type={alert?.type} />

        <form className="ch-form" onSubmit={handleSendCode} noValidate>
          <div className="ch-input-group">
            <input
              type="email"
              placeholder="Correo electrónico"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-ch-primary" disabled={loading}>
            {loading ? <span className="ch-spinner" /> : <span className="btn-text">Enviar código</span>}
          </button>
        </form>

        <Link to="/login" className="ch-link-center">Volver al inicio de sesión</Link>
      </div>
    </div>
  )
}
