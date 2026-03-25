import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth, API_BASE } from '../context/AuthContext'
import AppTopbar, { AppLogoCircle } from '../components/AppTopbar'
import BottomNav from '../components/BottomNav'

function pad(num, size) {
  return String(num).padStart(size, '0')
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
  const { authHeaders } = useAuth()
  const [userData, setUserData] = useState(null)
  const [balance, setBalance] = useState(0)

  // Estancia form
  const [showEstancia, setShowEstancia] = useState(false)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [estanciaLoading, setEstanciaLoading] = useState(false)
  const [estancias, setEstancias] = useState([])
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    async function cargarHome() {
      try {
        const [meRes, puntosRes, estRes] = await Promise.all([
          fetch(`${API_BASE}/auth/me`, { headers: authHeaders() }),
          fetch(`${API_BASE}/lealtad/puntos`, { headers: authHeaders() }),
          fetch(`${API_BASE}/lealtad/estancias`, { headers: authHeaders() }),
        ])
        const meData = await meRes.json()
        const puntosData = await puntosRes.json()
        const estData = await estRes.json()
        setUserData(meData.user)
        setBalance(puntosData.balance || 0)
        setEstancias(estData.estancias || [])
      } catch (err) {
        console.error('Error cargando home:', err)
      }
    }
    cargarHome()
  }, [])

  async function handleEstanciaSubmit(e) {
    e.preventDefault()
    setAlert(null)
    setEstanciaLoading(true)
    try {
      const res = await fetch(`${API_BASE}/lealtad/estancias`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ fecha_check_in: checkIn, fecha_check_out: checkOut }),
      })
      const data = await res.json()
      if (!res.ok) { setAlert({ message: data.error || 'Error al registrar estancia.', type: 'error' }); return }
      setAlert({ message: '¡Estancia registrada! Pendiente de aprobación por el administrador.', type: 'success' })
      setCheckIn(''); setCheckOut('')
      // Reload data
      const [puntosRes, estRes] = await Promise.all([
        fetch(`${API_BASE}/lealtad/puntos`, { headers: authHeaders() }),
        fetch(`${API_BASE}/lealtad/estancias`, { headers: authHeaders() }),
      ])
      const puntosData = await puntosRes.json()
      const estData = await estRes.json()
      setBalance(puntosData.balance || 0)
      setEstancias(estData.estancias || [])
    } catch {
      setAlert({ message: 'Error de conexión.', type: 'error' })
    } finally {
      setEstanciaLoading(false)
    }
  }

  const membresia = userData ? pad(userData.id, 4) : '—'
  const numTarjeta = userData ? pad(userData.id, 8) : '—'
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
        <div className="home-estancia-section">
          <button
            className="home-estancia-toggle"
            onClick={() => setShowEstancia(!showEstancia)}
          >
            <div className="home-estancia-toggle-left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Registrar Estancia</span>
            </div>
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transition: 'transform .2s', transform: showEstancia ? 'rotate(180deg)' : 'rotate(0)' }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {showEstancia && (
            <div className="home-estancia-body">
              {alert && <div className={`home-estancia-alert ${alert.type}`}>{alert.message}</div>}
              <p className="home-estancia-hint">Registra las fechas de tu estancia. Un administrador la revisará y asignará tus puntos.</p>
              <form className="home-estancia-form" onSubmit={handleEstanciaSubmit} noValidate>
                <div className="home-estancia-row">
                  <div className="home-estancia-field">
                    <label>Check-in</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      required
                    />
                  </div>
                  <div className="home-estancia-field">
                    <label>Check-out</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-ch-primary" disabled={estanciaLoading} style={{ marginTop: 4 }}>
                  {estanciaLoading ? 'Registrando...' : 'Registrar Estancia'}
                </button>
              </form>

              {estancias.length > 0 && (
                <div className="home-estancia-history">
                  <p className="home-estancia-history-title">Últimas estancias</p>
                  {estancias.slice(0, 5).map((est, i) => (
                    <div key={i} className="home-estancia-item">
                      <div>
                        <span className="home-estancia-item-title">
                          {new Date(est.fecha_check_in).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} — {new Date(est.fecha_check_out).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="home-estancia-item-right">
                        <span className={`home-estancia-badge ${est.estado || 'pendiente'}`}>{est.estado || 'pendiente'}</span>
                        {est.puntos_ganados > 0 && <span className="home-estancia-pts">+{est.puntos_ganados} pts</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
