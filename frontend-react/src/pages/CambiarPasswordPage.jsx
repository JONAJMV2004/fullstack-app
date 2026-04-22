import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, API_BASE } from '../context/AuthContext'
import CielitoLogo from '../components/CielitoLogo'
import Alert from '../components/Alert'

export default function CambiarPasswordPage() {
  const { authHeaders } = useAuth()
  const navigate = useNavigate()
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1 = formulario, 2 = ingresar código
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [code, setCode] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Paso 1: validar y enviar código al email
  async function handleSendCode(e) {
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
      const res = await fetch(`${API_BASE}/auth/send-password-code`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert({ message: data.error || 'Error al enviar el código.', type: 'error' })
        return
      }
      setAlert({ message: data.message, type: 'success' })
      setCode('')
      setStep(2)
      startResendCooldown()
    } catch {
      setAlert({ message: 'Error de conexión.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Paso 2: verificar código y cambiar contraseña
  async function handleConfirm(e) {
    e.preventDefault()
    setAlert(null)

    if (!code.trim()) {
      setAlert({ message: 'Ingresa el código de verificación.', type: 'error' })
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
          verificationCode: code.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert({ message: data.error || 'Error al cambiar la contraseña.', type: 'error' })
        return
      }
      setAlert({ message: 'Contraseña actualizada correctamente.', type: 'success' })
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setCode('')
      setStep(1)
    } catch {
      setAlert({ message: 'Error de conexión.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  function startResendCooldown() {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setAlert(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/send-password-code`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
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
          </div>

          <h2 className="auth-title">Verifica tu Correo</h2>
          <p className="ch-subtitle" style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            Ingresa el código de 6 dígitos enviado a tu correo
          </p>

          <Alert message={alert?.message} type={alert?.type} />

          <form className="ch-form" onSubmit={handleConfirm} noValidate>
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

            <button type="submit" className="btn-ch-primary" disabled={loading || code.length < 6}>
              {loading ? <span className="ch-spinner" /> : <span className="btn-text">Confirmar cambio de contraseña</span>}
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
        <button type="button" className="ch-back-btn" onClick={() => navigate('/ajustes')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="auth-logo-circle">
          <CielitoLogo size={64} strokeColor="#2D6A50" strokeWidth="2" />
        </div>

        <h2 className="auth-title">Cambiar Contraseña</h2>

        <Alert message={alert?.message} type={alert?.type} />

        <form className="ch-form" onSubmit={handleSendCode} noValidate>
          <div className="ch-input-group ch-input-icon">
            <input
              name="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              placeholder="Contraseña actual"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={handleChange}
              required
            />
            <button type="button" className="ch-eye-btn" onClick={() => setShowCurrent(!showCurrent)}>
              {showCurrent ? <EyeOpen /> : <EyeClosed />}
            </button>
          </div>

          <div className="ch-input-group ch-input-icon">
            <input
              name="newPassword"
              type={showNew ? 'text' : 'password'}
              placeholder="Nueva contraseña"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={handleChange}
              required
            />
            <button type="button" className="ch-eye-btn" onClick={() => setShowNew(!showNew)}>
              {showNew ? <EyeOpen /> : <EyeClosed />}
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

          <div className="ch-input-group ch-input-icon">
            <input
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repite la nueva contraseña"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
            <button type="button" className="ch-eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? <EyeOpen /> : <EyeClosed />}
            </button>
          </div>

          <button type="submit" className="btn-ch-primary" disabled={loading}>
            {loading ? <span className="ch-spinner" /> : <span className="btn-text">Enviar código de verificación</span>}
          </button>
        </form>

        <p className="ch-switch" style={{ marginTop: '14px' }}>
          <button
            type="button"
            onClick={() => navigate('/ajustes')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', fontSize: '0.88rem' }}
          >
            Cancelar
          </button>
        </p>
      </div>
    </div>
  )
}
