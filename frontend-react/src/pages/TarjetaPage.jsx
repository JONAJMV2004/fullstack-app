import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, API_BASE } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import SideMenu from '../components/SideMenu'

// ── Helpers ──────────────────────────────────────────────────────────────────

function pad(num, size) { return String(num).padStart(size, '0') }

function generateCardNumber(userId) {
  const a = 1664525, c = 1013904223, m = 2 ** 32
  let s = parseInt(userId) || 1
  s = (s * a + c) % m; const p1 = String(s % 10000).padStart(4, '0')
  s = (s * a + c) % m; const p2 = String(s % 10000).padStart(4, '0')
  s = (s * a + c) % m; const p3 = String(s % 10000).padStart(4, '0')
  s = (s * a + c) % m; const p4 = String(s % 10000).padStart(4, '0')
  return `${p1} ${p2} ${p3} ${p4}`
}

function getNivel(balance) {
  if (balance >= 5000) return { nombre: 'ORO',    icon: '★★★', color: '#C9A84C', grad: 'linear-gradient(135deg,#A07830,#E8C97A,#C9A84C,#E8C97A,#A07830)' }
  if (balance >= 1000) return { nombre: 'PLATA',  icon: '★★',  color: '#94A3B8', grad: 'linear-gradient(135deg,#6B7A8D,#D1D8E0,#94A3B8,#D1D8E0,#6B7A8D)' }
  return                       { nombre: 'BRONCE', icon: '★',   color: '#CD7F32', grad: 'linear-gradient(135deg,#7B4F22,#CD7F32,#A0622A,#E0A050,#7B4F22)' }
}

function formatFecha(str) {
  if (!str) return '—'
  return new Date(str + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Circular progress ring ────────────────────────────────────────────────────
function ProgressRing({ balance, meta, progreso }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ - (progreso / 100) * circ
  return (
    <svg width="92" height="92" viewBox="0 0 92 92" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#A07830" />
          <stop offset="40%"  stopColor="#E8C97A" />
          <stop offset="100%" stopColor="#C9A84C" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Track */}
      <circle cx="46" cy="46" r={r} fill="none"
        stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
      {/* Progress */}
      <circle cx="46" cy="46" r={r} fill="none"
        stroke="url(#goldRing)" strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 46 46)"
        filter="url(#glow)"
        style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
      />
      {/* Center balance */}
      <text x="46" y="42" textAnchor="middle"
        fill="white" fontSize="17" fontWeight="700"
        fontFamily="Georgia, serif" letterSpacing="-0.5">
        {balance}
      </text>
      <text x="46" y="56" textAnchor="middle"
        fill="rgba(255,255,255,0.4)" fontSize="7"
        fontFamily="system-ui, sans-serif">
        / {meta?.toLocaleString()} pts
      </text>
    </svg>
  )
}

// ── NFC Chip SVG ──────────────────────────────────────────────────────────────
function NfcChip() {
  return (
    <svg width="38" height="28" viewBox="0 0 38 28" fill="none">
      <defs>
        <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8A959F" />
          <stop offset="40%" stopColor="#D1D8E0" />
          <stop offset="100%" stopColor="#8A959F" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="36" height="26" rx="4" fill="url(#chipGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
      <line x1="13" y1="1" x2="13" y2="27" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8"/>
      <line x1="25" y1="1" x2="25" y2="27" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8"/>
      <line x1="1" y1="9"  x2="37" y2="9"  stroke="rgba(0,0,0,0.15)" strokeWidth="0.8"/>
      <line x1="1" y1="19" x2="37" y2="19" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8"/>
      <rect x="14" y="10" width="10" height="8" rx="1" fill="rgba(0,0,0,0.12)" />
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const BG   = '#09180f'
const CARD = '#0f2a1a'

export default function TarjetaPage() {
  const { authHeaders } = useAuth()
  const [userData, setUserData] = useState(null)
  const [balance, setBalance]   = useState(0)
  const [codigos, setCodigos]   = useState([])

  useEffect(() => {
    async function load() {
      try {
        const [carnetRes, codigosRes] = await Promise.all([
          fetch(`${API_BASE}/lealtad/carnet`,  { headers: authHeaders() }),
          fetch(`${API_BASE}/lealtad/codigos`, { headers: authHeaders() }),
        ])
        const carnet   = await carnetRes.json()
        const codsData = await codigosRes.json()
        setUserData(carnet.user)
        setBalance(carnet.balance || 0)
        setCodigos(codsData.codigos || [])
      } catch (err) { console.error(err) }
    }
    load()
  }, [authHeaders])

  const membresia  = userData ? pad(userData.id, 4) : '——'
  const numTarjeta = userData ? generateCardNumber(userData.id) : '•••• •••• •••• ••••'
  const nombre     = userData?.nombre || userData?.name || '—'
  const initials   = nombre !== '—' ? nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'
  const nivel      = getNivel(balance)
  const nextNivel  = balance < 1000 ? { nombre: 'Plata', meta: 1000 }
                   : balance < 5000 ? { nombre: 'Oro',   meta: 5000 } : null
  const progreso   = nextNivel ? Math.min((balance / nextNivel.meta) * 100, 100) : 100

  // Neomorphic shadow helpers
  const neoOut  = '6px 6px 14px rgba(0,0,0,0.55), -3px -3px 8px rgba(255,255,255,0.03)'
  const neoIn   = 'inset 3px 3px 8px rgba(0,0,0,0.5), inset -2px -2px 6px rgba(255,255,255,0.04)'

  return (
    <div style={{
      background: BG,
      minHeight: '100vh',
      paddingBottom: 82,
      fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ maxWidth: 430, margin: '0 auto', padding: '0 18px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 52, paddingBottom: 4 }}>
          {/* Logo */}
          <div style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '1.35rem',
            fontWeight: 400,
            background: 'linear-gradient(135deg,#A07830,#E8C97A,#C9A84C)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.06em',
          }}>
            Cielito Home
          </div>
          {/* Menú lateral funcional */}
          <SideMenu />
        </div>

        {/* ── Title ── */}
        <h1 style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '1.15rem',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.85)',
          letterSpacing: '0.05em',
          margin: '18px 0 14px',
        }}>
          Mi Tarjeta
        </h1>

        {/* ── Membership Card ── */}
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
            <NfcChip />
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
          }}>{numTarjeta}</p>

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

        {/* ── Points Panels ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>

          {/* Left — Progress Ring */}
          <div style={{
            background: CARD,
            borderRadius: 18,
            padding: '16px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: neoOut,
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            {nextNivel ? (
              <ProgressRing balance={balance} meta={nextNivel.meta} progreso={progreso} />
            ) : (
              <ProgressRing balance={balance} meta={5000} progreso={100} />
            )}
            <div style={{ marginTop: 8, fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 1.4 }}>
              {nextNivel ? `${balance} / ${nextNivel.meta.toLocaleString()} Puntos` : 'Nivel máximo'}
            </div>
          </div>

          {/* Right — Avatar + Info */}
          <div style={{
            background: CARD,
            borderRadius: 18,
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: neoOut,
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            {/* Avatar with silver frame */}
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg,#6B7A8D,#D1D8E0,#94A3B8)',
              padding: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.4)',
            }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: 'linear-gradient(145deg, #1a3a26, #0f2018)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', fontWeight: 700, color: 'white', letterSpacing: '0.05em',
              }}>
                {initials}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>
                Puntos disponibles
              </div>
              <div style={{
                fontSize: '1.4rem', fontWeight: 800, lineHeight: 1,
                background: 'linear-gradient(135deg,#A07830,#E8C97A)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {balance.toLocaleString()}
              </div>
              {nextNivel && (
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                  Progreso a nivel {nextNivel.nombre}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Recompensas y Acciones ── */}
        <div style={{
          background: CARD,
          borderRadius: 18,
          padding: '16px 16px',
          marginBottom: 14,
          boxShadow: neoOut,
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Recompensas y Acciones
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Main action button */}
            <Link to="/recompensas" style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              background: 'linear-gradient(145deg, #162e1e, #0d2015)',
              border: '1px solid rgba(201,168,76,0.25)',
              borderRadius: 14,
              padding: '13px 16px',
              color: 'white',
              textDecoration: 'none',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.88rem',
              letterSpacing: '0.03em',
              boxShadow: neoOut,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12"/>
                <rect x="2" y="7" width="20" height="5"/>
                <line x1="12" y1="22" x2="12" y2="7"/>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
              Canjear Puntos
            </Link>

            {/* Secondary lock/history button */}
            <Link to="/recompensas?tab=historial" style={{
              width: 48, height: 48,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(145deg, #162e1e, #0d2015)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14,
              flexShrink: 0,
              boxShadow: neoOut,
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* ── Mis Estadías ── */}
        <div style={{
          background: CARD,
          borderRadius: 18,
          padding: '16px 16px',
          marginBottom: 14,
          boxShadow: neoOut,
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Mis Estadías
          </div>

          {codigos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem' }}>
              Sin estadías registradas
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {codigos.map(c => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'linear-gradient(145deg, #162e1e, #0d2015)',
                  borderRadius: 14, padding: '12px 14px',
                  boxShadow: neoIn,
                  border: '1px solid rgba(255,255,255,0.04)',
                }}>
                  {/* House icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: 'linear-gradient(145deg, #1e3d28, #142a1c)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: neoOut,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.ubicacion || 'Cielito Home'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                        {formatFecha(c.fecha_ingreso)} — {formatFecha(c.fecha_salida)}
                      </span>
                      {/* Points loading indicator */}
                      <span style={{
                        fontSize: '0.6rem', color: 'rgba(201,168,76,0.8)',
                        display: 'flex', alignItems: 'center', gap: 3,
                      }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                        </svg>
                        +{c.puntos} pts
                      </span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div style={{
                    flexShrink: 0,
                    background: c.estatus === 'canjeado'
                      ? 'rgba(52,168,83,0.18)'
                      : 'rgba(255,193,7,0.15)',
                    border: c.estatus === 'canjeado'
                      ? '1px solid rgba(52,168,83,0.35)'
                      : '1px solid rgba(255,193,7,0.3)',
                    borderRadius: 8,
                    padding: '4px 9px',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: c.estatus === 'canjeado' ? '#5edb8a' : '#ffd54f',
                    textTransform: 'capitalize',
                  }}>
                    {c.estatus === 'canjeado' ? 'Canjeado' : 'Disponible'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <BottomNav />
    </div>
  )
}
