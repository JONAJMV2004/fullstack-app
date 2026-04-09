import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth, API_BASE } from '../context/AuthContext'
import AppTopbar, { AppLogoCircle } from '../components/AppTopbar'
import BottomNav from '../components/BottomNav'

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

export default function TarjetaPage() {
  const { authHeaders } = useAuth()
  const [userData, setUserData] = useState(null)
  const [balance, setBalance] = useState(0)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    async function cargarDatos() {
      try {
        // Single request to lightweight /carnet endpoint (2x faster than dual requests)
        const res = await fetch(`${API_BASE}/lealtad/carnet`, { headers: authHeaders() })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setUserData(data.user)
        setBalance(data.balance || 0)
      } catch (err) {
        console.error('Error cargando tarjeta:', err)
      }
    }
    cargarDatos()
  }, [authHeaders])

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

        {/* ── QR ── */}
        <button className="tc-qr-toggle" onClick={() => setShowQR(v => !v)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          {showQR ? 'Ocultar código QR' : 'Mostrar código QR'}
        </button>

        {showQR && (
          <div className="tc-qr-container">
            <QRCodeSVG
              value={`CIELITO-${numTarjeta}`}
              size={140}
              fgColor="#2D6A50"
              bgColor="#ffffff"
              level="M"
              style={{ borderRadius: 8 }}
            />
            <p className="tc-qr-hint">Presenta este código en caja para acumular puntos</p>
          </div>
        )}

        {/* ── Acciones ── */}
        <div className="tc-actions">
          <Link to="/recompensas" className="btn-ch-primary tc-action-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"/><polyline points="12 3 12 15"/><path d="M4 7l8-4 8 4"/></svg>
            Canjear Puntos
          </Link>
          <Link to="/recompensas?tab=historial" className="tc-action-btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
            Ver Historial
          </Link>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
