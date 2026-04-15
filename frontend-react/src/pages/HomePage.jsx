import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, API_BASE } from '../context/AuthContext'
import AppTopbar, { AppLogoCircle } from '../components/AppTopbar'
import BottomNav from '../components/BottomNav'

const PWA_NEW_USER_KEY = 'pwa_prompt_new_user'
const PWA_DISMISSED_PREFIX = 'pwa_prompt_dismissed_'
const PWA_FIRST_VISIT_PREFIX = 'pwa_prompt_seen_home_'
const PWA_LANDING_SEEN_KEY = 'pwa_prompt_seen_landing'

function pad(num, size) {
  return String(num).padStart(size, '0')
}

function generateCardNumber(userId) {
  const a = 1664525, c = 1013904223, m = 2 ** 32
  let s = parseInt(userId) || 1
  s = (s * a + c) % m; const p1 = String(s % 10000).padStart(4, '0')
  s = (s * a + c) % m; const p2 = String(s % 10000).padStart(4, '0')
  s = (s * a + c) % m; const p3 = String(s % 10000).padStart(4, '0')
  s = (s * a + c) % m; const p4 = String(s % 10000).padStart(4, '0')
  return `${p1}${p2}${p3}${p4}`
}

function formatCardNumber(num) {
  return num.replace(/(.{4})/g, '$1 ').trim()
}

function getNivel(balance) {
  if (balance >= 5000) return { nombre: 'ORO',    color: '#C9A84C', icon: '★★★', grad: 'linear-gradient(135deg,#A07830,#E8C97A,#C9A84C,#E8C97A,#A07830)' }
  if (balance >= 1000) return { nombre: 'PLATA',  color: '#94A3B8', icon: '★★',  grad: 'linear-gradient(135deg,#6B7A8D,#D1D8E0,#94A3B8,#D1D8E0,#6B7A8D)' }
  return                       { nombre: 'BRONCE', color: '#CD7F32', icon: '★',   grad: 'linear-gradient(135deg,#7B4F22,#CD7F32,#A0622A,#E0A050,#7B4F22)' }
}

export default function HomePage() {
  const { token, user, authHeaders, clearSession } = useAuth()
  const [userData, setUserData] = useState(null)
  const [balance, setBalance] = useState(0)
  const [pwaPromptEvent, setPwaPromptEvent] = useState(null)
  const [showPwaPrompt, setShowPwaPrompt] = useState(false)
  const [isIosDevice, setIsIosDevice] = useState(false)
  const [isStandaloneMode, setIsStandaloneMode] = useState(false)
  const [installHelpText, setInstallHelpText] = useState('')

  // Canjear código
  const [codigoInput, setCodigoInput] = useState('')
  const [codigoLoading, setCodigoLoading] = useState(false)
  const [codigosCanjeados, setCodigosCanjeados] = useState([])
  const [alert, setAlert] = useState(null)
  const [pendingCodigo, setPendingCodigo] = useState(null)

  async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async function fetchJsonWithRetry(url, options = {}, retries = 2) {
    let lastError = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, options)
        const data = await res.json().catch(() => ({}))

        if (res.status === 401 || res.status === 403) {
          const authError = new Error('Sesion expirada')
          authError.code = 'AUTH'
          throw authError
        }

        if (!res.ok) {
          const shouldRetry = [502, 503, 504].includes(res.status) && attempt < retries
          if (shouldRetry) {
            await wait((attempt + 1) * 600)
            continue
          }

          throw new Error(data.error || `HTTP ${res.status}`)
        }

        return data
      } catch (error) {
        lastError = error
        const isNetworkError = error instanceof TypeError
        const canRetry = attempt < retries && isNetworkError
        if (canRetry) {
          await wait((attempt + 1) * 600)
          continue
        }
        throw error
      }
    }

    throw lastError
  }

  // Detectar ?codigo= en la URL al montar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const codigoParam = params.get('codigo')
    if (codigoParam) {
      window.history.replaceState({}, '', '/home')
      setPendingCodigo(codigoParam.toUpperCase())
    }
  }, [])

  async function cargarDatos() {
    if (!token) return
    try {
      const meData = await fetchJsonWithRetry(`${API_BASE}/auth/me`, { headers: authHeaders() })
      const [puntosData, codigosData] = await Promise.all([
        fetchJsonWithRetry(`${API_BASE}/lealtad/puntos`, { headers: authHeaders() }),
        fetchJsonWithRetry(`${API_BASE}/lealtad/codigos`, { headers: authHeaders() }),
      ])
      setUserData(meData.user)
      setBalance(puntosData.balance || 0)
      setCodigosCanjeados(codigosData.codigos || [])
    } catch (err) {
      if (err?.code === 'AUTH') {
        clearSession()
        return
      }
      console.error('Error cargando home:', err)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [token])

  // Auto-canjear cuando hay un código pendiente y el token ya está listo
  useEffect(() => {
    if (!pendingCodigo || !token) return
    setPendingCodigo(null)
    setCodigoLoading(true)
    setAlert(null)
    fetch(`${API_BASE}/lealtad/codigos/canjear`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ codigo: pendingCodigo }),
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setAlert({ message: data.error || 'Error al canjear el código.', type: 'error' })
        } else {
          setAlert({ message: data.message, type: 'success' })
          cargarDatos()
        }
      })
      .catch(() => setAlert({ message: 'Error de conexión.', type: 'error' }))
      .finally(() => setCodigoLoading(false))
  }, [pendingCodigo, token])

  async function handleCodigoSubmit(e) {
    e.preventDefault()
    setAlert(null)

    if (!codigoInput.trim()) {
      setAlert({ message: 'Ingresa un código.', type: 'error' })
      return
    }

    setCodigoLoading(true)
    try {
      const res = await fetch(`${API_BASE}/lealtad/codigos/canjear`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ codigo: codigoInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert({ message: data.error || 'Error al canjear el código.', type: 'error' })
        return
      }
      setAlert({ message: data.message, type: 'success' })
      setCodigoInput('')
      await cargarDatos()
    } catch (err) {
      if (err?.code === 'AUTH') {
        clearSession()
        return
      }
      setAlert({ message: 'Error de conexión.', type: 'error' })
    } finally {
      setCodigoLoading(false)
    }
  }

  const membresia = userData ? pad(userData.id, 4) : '—'
  const numTarjeta = userData ? generateCardNumber(userData.id) : '0000000000000000'
  const nombre = userData?.nombre || userData?.name || '—'
  const nivel = getNivel(balance)

  return (
    <div className="app-body">
      <div className="app-page home-page">
        <AppTopbar balance={balance} nivel={nivel} />
        <AppLogoCircle />

        {showPwaPrompt && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="pwa-modal-title">
            <div className="modal-card pwa-modal-card">
              <div className="pwa-modal-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M12 3v12" />
                  <path d="m8 11 4 4 4-4" />
                  <rect x="4" y="17" width="16" height="4" rx="1.5" />
                </svg>
              </div>
              <h3 id="pwa-modal-title" className="modal-title">Instala Cielito Home</h3>
              <p className="modal-desc">
                Te recomendamos instalar la app para abrirla más rápido y recibir una experiencia más fluida.
                {isIosDevice && !pwaPromptEvent && ' En Safari, usa Compartir y luego Agregar a pantalla de inicio.'}
              </p>
              {installHelpText && <p className="pwa-install-note">{installHelpText}</p>}

              <div className="modal-actions pwa-modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={handleClosePwaPrompt}>Ahora no</button>
                <button type="button" className="btn-ch-primary modal-confirm-btn" onClick={handleInstallPwa}>Instalar</button>
              </div>
            </div>
          </div>
        )}

        <h1 className="app-section-title">Mi Tarjeta</h1>

        {/* ── Tarjeta principal ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0d2a18 0%, #1a3d26 50%, #0a1f12 100%)',
          borderRadius: 20,
          padding: '22px 22px 18px',
          marginBottom: 18,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(201,168,76,0.25)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>
          {/* Overlay decorativo */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle at 70% 20%, rgba(201,168,76,0.08) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(13,90,50,0.3) 0%, transparent 50%)',
            pointerEvents: 'none',
          }} />

          {/* Header: marca + nivel */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/></svg>
              <span style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.88rem',
                letterSpacing: '0.08em',
                background: 'linear-gradient(135deg,#A07830,#E8C97A,#C9A84C)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Cielito Home</span>
            </div>
            <div style={{
              background: nivel.grad,
              borderRadius: 20,
              padding: '4px 10px',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#1a0f00',
              display: 'flex', alignItems: 'center', gap: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}>
              <span>{nivel.icon}</span> {nivel.nombre}
            </div>
          </div>

          {/* Chip EMV */}
          <div style={{ marginBottom: 16, position: 'relative' }}>
            <svg width="38" height="28" viewBox="0 0 38 28" fill="none">
              <defs>
                <linearGradient id="hpChipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8A959F" />
                  <stop offset="40%" stopColor="#D1D8E0" />
                  <stop offset="100%" stopColor="#8A959F" />
                </linearGradient>
              </defs>
              <rect x="1" y="1" width="36" height="26" rx="4" fill="url(#hpChipGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
              <line x1="13" y1="1" x2="13" y2="27" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8"/>
              <line x1="25" y1="1" x2="25" y2="27" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8"/>
              <line x1="1" y1="9"  x2="37" y2="9"  stroke="rgba(0,0,0,0.15)" strokeWidth="0.8"/>
              <line x1="1" y1="19" x2="37" y2="19" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8"/>
              <rect x="14" y="10" width="10" height="8" rx="1" fill="rgba(0,0,0,0.12)" />
            </svg>
          </div>

          {/* Número de tarjeta */}
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '1.15rem',
            letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.9)',
            margin: '0 0 18px',
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            position: 'relative',
          }}>{formatCardNumber(numTarjeta)}</p>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            <div>
              <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Titular</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.06em' }}>{nombre.toUpperCase()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Membresía</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.06em' }}>{membresia}</div>
            </div>
          </div>
        </div>

        {/* ── Canjear Código ── */}
        <div className="booking-section" style={{ marginBottom: 24 }}>
          <div className="booking-toggle-left" style={{ padding: '14px 16px 10px' }}>
            <div className="booking-toggle-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <div className="booking-toggle-title">Canjear Código</div>
              <div className="booking-toggle-sub">Ingresa el código de tu estadía para acumular puntos</div>
            </div>
          </div>

          <div className="booking-body">
            {alert && (
              <div className={`booking-alert ${alert.type}`}>
                {alert.type === 'success'
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                }
                {alert.message}
              </div>
            )}

            <form className="booking-form" onSubmit={handleCodigoSubmit} noValidate>
              <div className="booking-field-group">
                <div className="booking-field-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Código de estadía
                </div>
                <input
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    fontSize: 16, fontWeight: 600,
                    letterSpacing: 2, textTransform: 'uppercase', outline: 'none',
                    boxSizing: 'border-box',
                    background: '#0f2a1a',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                  type="text"
                  placeholder="Ej: CIELITO2025"
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                  maxLength={30}
                  autoComplete="off"
                  autoCapitalize="characters"
                />
              </div>

              <button type="submit" className="booking-submit" disabled={codigoLoading || !codigoInput.trim()}>
                {codigoLoading
                  ? <><span className="booking-spinner"/><span>Validando...</span></>
                  : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span>Canjear Código</span></>
                }
              </button>
            </form>
          </div>
        </div>

        <Link to="/recompensas" style={{ textDecoration: 'none', display: 'block', marginBottom: 18 }}>
          <div style={{
            background: 'linear-gradient(135deg, #0d2a18 0%, #1a3d26 60%, #0a1f12 100%)',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(201,168,76,0.12)',
                border: '1px solid rgba(201,168,76,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                </svg>
              </div>
              <div>
                <div style={{
                  fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.02em',
                  background: 'linear-gradient(135deg,#A07830,#E8C97A,#C9A84C)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Canjear Puntos</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                  Explora premios disponibles
                </div>
              </div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </Link>

        {/* ── Historial de códigos canjeados ── */}
        {codigosCanjeados.length > 0 && (
          <div className="booking-history">
            <div className="booking-history-title">Mis estadías</div>
            {codigosCanjeados.map((c, i) => {
              const noches = c.noches
              return (
                <div key={i} className="booking-history-item">
                  <div className="booking-history-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  </div>
                  <div className="booking-history-info">
                    <div className="booking-history-loc">{c.ubicacion}</div>
                    <div className="booking-history-dates">
                      {new Date(c.fecha_ingreso + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                      {' → '}
                      {new Date(c.fecha_salida + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      <span className="booking-history-nights">· {noches} noche{noches !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="booking-history-right">
                    <span className="home-estancia-badge confirmada">canjeado</span>
                    {c.puntos > 0 && <span className="home-estancia-pts">+{c.puntos} pts</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
