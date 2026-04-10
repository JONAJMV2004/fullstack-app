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
  if (balance >= 5000) return { nombre: 'Oro', color: '#D4A017', icon: '★★★' }
  if (balance >= 1000) return { nombre: 'Plata', color: '#94A3B8', icon: '★★' }
  return { nombre: 'Bronce', color: '#CD7F32', icon: '★' }
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

  // Estancia form
  const [showEstancia, setShowEstancia] = useState(false)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [ubicaciones, setUbicaciones] = useState([])
  const [estanciaLoading, setEstanciaLoading] = useState(false)
  const [estancias, setEstancias] = useState([])
  const [alert, setAlert] = useState(null)
  const currentUserId = user?.id || userData?.id

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

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || ''
    const isiOS = /iPad|iPhone|iPod/.test(userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    setIsIosDevice(isiOS)
    setIsStandaloneMode(isStandalone)

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setPwaPromptEvent(event)
    }

    const handleAppInstalled = () => {
      if (currentUserId) {
        localStorage.removeItem(PWA_NEW_USER_KEY)
        localStorage.setItem(`${PWA_DISMISSED_PREFIX}${currentUserId}`, '1')
        localStorage.setItem(`${PWA_FIRST_VISIT_PREFIX}${currentUserId}`, '1')
      }
      setShowPwaPrompt(false)
      setPwaPromptEvent(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [currentUserId])

  useEffect(() => {
    if (!currentUserId) return

    const pendingForUser = localStorage.getItem(PWA_NEW_USER_KEY)
    const landingPromptHandled = localStorage.getItem(PWA_LANDING_SEEN_KEY) === '1'
    const alreadyDismissed = localStorage.getItem(`${PWA_DISMISSED_PREFIX}${currentUserId}`) === '1'
    const alreadySeenHome = localStorage.getItem(`${PWA_FIRST_VISIT_PREFIX}${currentUserId}`) === '1'
    const isNewUserPending = pendingForUser === String(currentUserId)

    if (alreadyDismissed) {
      return
    }

    if (landingPromptHandled && !isNewUserPending) {
      localStorage.setItem(`${PWA_FIRST_VISIT_PREFIX}${currentUserId}`, '1')
      return
    }

    if (isStandaloneMode) {
      localStorage.removeItem(PWA_NEW_USER_KEY)
      localStorage.setItem(`${PWA_FIRST_VISIT_PREFIX}${currentUserId}`, '1')
      return
    }

    if (!isNewUserPending && alreadySeenHome) {
      return
    }

    setShowPwaPrompt(true)
    localStorage.setItem(`${PWA_FIRST_VISIT_PREFIX}${currentUserId}`, '1')
  }, [currentUserId, isStandaloneMode])

  useEffect(() => {
    async function cargarHome() {
      if (!token) return

      try {
        const meData = await fetchJsonWithRetry(`${API_BASE}/auth/me`, { headers: authHeaders() })
        const [puntosData, estData, ubicacionesData] = await Promise.all([
          fetchJsonWithRetry(`${API_BASE}/lealtad/puntos`, { headers: authHeaders() }),
          fetchJsonWithRetry(`${API_BASE}/lealtad/estancias`, { headers: authHeaders() }),
          fetchJsonWithRetry(`${API_BASE}/lealtad/ubicaciones`, { headers: authHeaders() }),
        ])

        setUserData(meData.user)
        setBalance(puntosData.balance || 0)
        setEstancias(estData.estancias || [])
        setUbicaciones(ubicacionesData.ubicaciones || [])
      } catch (err) {
        if (err?.code === 'AUTH') {
          clearSession()
          return
        }
        console.error('Error cargando home:', err)
      }
    }
    cargarHome()
  }, [token, authHeaders, clearSession])

  async function handleInstallPwa() {
    if (!pwaPromptEvent) {
      if (isIosDevice) {
        setInstallHelpText('En iPhone: Safari > Compartir > Agregar a pantalla de inicio.')
      } else {
        setInstallHelpText('Si no aparece el instalador, abre el menu del navegador y selecciona Instalar app o Agregar a pantalla de inicio.')
      }
      return
    }

    pwaPromptEvent.prompt()
    const choice = await pwaPromptEvent.userChoice

    if (choice?.outcome === 'accepted' && currentUserId) {
      localStorage.removeItem(PWA_NEW_USER_KEY)
      localStorage.setItem(`${PWA_DISMISSED_PREFIX}${currentUserId}`, '1')
      localStorage.setItem(`${PWA_FIRST_VISIT_PREFIX}${currentUserId}`, '1')
      setShowPwaPrompt(false)
    }

    setPwaPromptEvent(null)
  }

  function handleClosePwaPrompt() {
    if (currentUserId) {
      localStorage.removeItem(PWA_NEW_USER_KEY)
      localStorage.setItem(`${PWA_DISMISSED_PREFIX}${currentUserId}`, '1')
      localStorage.setItem(`${PWA_FIRST_VISIT_PREFIX}${currentUserId}`, '1')
    }
    setInstallHelpText('')
    setShowPwaPrompt(false)
  }

  async function handleEstanciaSubmit(e) {
    e.preventDefault()
    setAlert(null)

    if (!ubicacion) {
      setAlert({ message: 'Selecciona una ubicación.', type: 'error' })
      return
    }

    setEstanciaLoading(true)
    try {
      const res = await fetch(`${API_BASE}/lealtad/estancias`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ fecha_check_in: checkIn, fecha_check_out: checkOut, ubicacion }),
      })
      const data = await res.json()
      if (!res.ok) { setAlert({ message: data.error || 'Error al registrar estancia.', type: 'error' }); return }
      setAlert({ message: '¡Estancia registrada! Pendiente de aprobación por el administrador.', type: 'success' })
      setCheckIn(''); setCheckOut(''); setUbicacion('')
      // Reload data
      const [puntosData, estData, ubicacionesData] = await Promise.all([
        fetchJsonWithRetry(`${API_BASE}/lealtad/puntos`, { headers: authHeaders() }),
        fetchJsonWithRetry(`${API_BASE}/lealtad/estancias`, { headers: authHeaders() }),
        fetchJsonWithRetry(`${API_BASE}/lealtad/ubicaciones`, { headers: authHeaders() }),
      ])
      setBalance(puntosData.balance || 0)
      setEstancias(estData.estancias || [])
      setUbicaciones(ubicacionesData.ubicaciones || [])
    } catch (err) {
      if (err?.code === 'AUTH') {
        clearSession()
        return
      }
      setAlert({ message: 'Error de conexión.', type: 'error' })
    } finally {
      setEstanciaLoading(false)
    }
  }

  const membresia = userData ? pad(userData.id, 4) : '—'
  const numTarjeta = userData ? generateCardNumber(userData.id) : '0000000000000000'
  const nombre = userData?.nombre || userData?.name || '—'
  const initials = nombre !== '—' ? nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'
  const nivel = getNivel(balance)
  const nextNivel = balance < 1000 ? { nombre: 'Plata', meta: 1000 } : balance < 5000 ? { nombre: 'Oro', meta: 5000 } : null
  const progreso = nextNivel ? Math.min((balance / nextNivel.meta) * 100, 100) : 100

  return (
    <div className="app-body">
      <div className="app-page home-page">
        <AppTopbar />
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
        <div className="tc-card">
          <div className="tc-card-pattern" />
          <div className="tc-card-header">
            <div className="tc-brand">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/></svg>
              <span>Cielito Home</span>
            </div>
            <div className="tc-nivel" style={{ background: nivel.color }}>
              <span>{nivel.icon}</span> {nivel.nombre}
            </div>
          </div>

          <div className="tc-chip">
            <svg width="28" height="20" viewBox="0 0 28 20" fill="none"><rect x="1" y="1" width="26" height="18" rx="3" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/><line x1="10" y1="1" x2="10" y2="19" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/><line x1="18" y1="1" x2="18" y2="19" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/><line x1="1" y1="7" x2="27" y2="7" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/><line x1="1" y1="13" x2="27" y2="13" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/></svg>
          </div>

          <p className="tc-number">{formatCardNumber(numTarjeta)}</p>

          <div className="tc-card-footer">
            <div>
              <p className="tc-footer-label">Titular</p>
              <p className="tc-footer-value">{nombre.toUpperCase()}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="tc-footer-label">Membresía</p>
              <p className="tc-footer-value">{membresia}</p>
            </div>
          </div>
        </div>

        {/* ── Puntos ── */}
        <div className="tc-balance-card">
          <div className="tc-balance-top">
            <div className="tc-balance-avatar">{initials}</div>
            <div className="tc-balance-info">
              <p className="tc-balance-label">Puntos disponibles</p>
              <p className="tc-balance-amount">{balance.toLocaleString()}</p>
            </div>
          </div>
          {nextNivel && (
            <div className="tc-progress-section">
              <div className="tc-progress-header">
                <span className="tc-progress-text">Progreso a nivel {nextNivel.nombre}</span>
                <span className="tc-progress-text">{balance} / {nextNivel.meta.toLocaleString()}</span>
              </div>
              <div className="tc-progress-bar">
                <div className="tc-progress-fill" style={{ width: `${progreso}%` }} />
              </div>
            </div>
          )}
        </div>

        <Link to="/recompensas" className="btn-ch-primary home-canjear-btn">Canjear Puntos</Link>

        {/* ── Registrar Estancia ── */}
        <div className="booking-section">

          {/* Header toggle */}
          <button className="booking-toggle" onClick={() => setShowEstancia(!showEstancia)}>
            <div className="booking-toggle-left">
              <div className="booking-toggle-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div>
                <div className="booking-toggle-title">Registrar Estancia</div>
                <div className="booking-toggle-sub">Acumula puntos por tu estadía</div>
              </div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transition: 'transform .25s', transform: showEstancia ? 'rotate(180deg)' : 'rotate(0)', flexShrink: 0, color: '#2D6A50' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {showEstancia && (
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

              <form className="booking-form" onSubmit={handleEstanciaSubmit} noValidate>

                {/* Ubicación */}
                <div className="booking-field-group">
                  <div className="booking-field-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    Ubicación
                  </div>
                  {ubicaciones.length === 0 ? (
                    <p className="booking-no-locations">No hay ubicaciones disponibles.</p>
                  ) : (
                    <div className="booking-location-grid">
                      {ubicaciones.map((u) => (
                        <button
                          key={u}
                          type="button"
                          className={`booking-location-btn${ubicacion === u ? ' selected' : ''}`}
                          onClick={() => setUbicacion(ubicacion === u ? '' : u)}
                        >
                          {ubicacion === u && (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                          {u}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fechas */}
                <div className="booking-dates-card">
                  <div className="booking-date-block">
                    <div className="booking-date-label">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      Llegada
                    </div>
                    <input
                      className="booking-date-input"
                      type="date"
                      value={checkIn}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut('') }}
                      required
                    />
                    {checkIn && <div className="booking-date-display">{new Date(checkIn + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</div>}
                  </div>

                  <div className="booking-dates-divider">
                    {checkIn && checkOut ? (
                      <div className="booking-nights-badge">
                        {Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)}
                        <span>noche{Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000) !== 1 ? 's' : ''}</span>
                      </div>
                    ) : (
                      <div className="booking-dates-arrow">→</div>
                    )}
                  </div>

                  <div className="booking-date-block">
                    <div className="booking-date-label">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                      Salida
                    </div>
                    <input
                      className="booking-date-input"
                      type="date"
                      value={checkOut}
                      min={checkIn || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setCheckOut(e.target.value)}
                      required
                    />
                    {checkOut && <div className="booking-date-display">{new Date(checkOut + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</div>}
                  </div>
                </div>

                {/* Resumen */}
                {ubicacion && checkIn && checkOut && (
                  <div className="booking-summary">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                    <span><strong>{ubicacion}</strong> · {Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)} noche{Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000) !== 1 ? 's' : ''}</span>
                  </div>
                )}

                <button type="submit" className="booking-submit" disabled={estanciaLoading || !ubicacion || !checkIn || !checkOut}>
                  {estanciaLoading
                    ? <><span className="booking-spinner"/><span>Registrando...</span></>
                    : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg><span>Confirmar Reserva</span></>
                  }
                </button>
              </form>

            </div>
          )}
        </div>

        {/* Historial de reservas — siempre visible */}
        {estancias.length > 0 && (
          <div className="booking-history">
            <div className="booking-history-title">Mis reservas</div>
            {estancias.map((est, i) => {
              const noches = Math.round((new Date(est.fecha_check_out) - new Date(est.fecha_check_in)) / 86400000)
              return (
                <div key={i} className="booking-history-item">
                  <div className="booking-history-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  </div>
                  <div className="booking-history-info">
                    <div className="booking-history-loc">{est.ubicacion || 'Sin ubicación'}</div>
                    <div className="booking-history-dates">
                      {new Date(est.fecha_check_in + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                      {' → '}
                      {new Date(est.fecha_check_out + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      <span className="booking-history-nights">· {noches} noche{noches !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="booking-history-right">
                    <span className={`home-estancia-badge ${est.estado || 'pendiente'}`}>{est.estado || 'pendiente'}</span>
                    {est.puntos_ganados > 0 && <span className="home-estancia-pts">+{est.puntos_ganados} pts</span>}
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
