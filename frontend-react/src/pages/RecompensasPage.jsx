import { useState, useEffect } from 'react'
import { useAuth, API_BASE } from '../context/AuthContext'
import AppTopbar, { AppLogoCircle } from '../components/AppTopbar'
import BottomNav from '../components/BottomNav'
import Alert from '../components/Alert'

export default function RecompensasPage() {
  const { authHeaders } = useAuth()
  const [alert, setAlert] = useState(null)
  const [balance, setBalance] = useState(0)
  const [premios, setPremios] = useState([])
  const [canjes, setCanjes] = useState([])
  const [activeTab, setActiveTab] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    return tab === 'historial' ? 'historial' : 'descuentos'
  })
  const [modal, setModal] = useState(null)
  const [canjeLoading, setCanjeLoading] = useState(false)
  const [estanciaActiva, setEstanciaActiva] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    try {
      const [puntosRes, premiosRes, canjesRes] = await Promise.all([
        fetch(`${API_BASE}/lealtad/puntos`, { headers: authHeaders() }),
        fetch(`${API_BASE}/lealtad/premios`, { headers: authHeaders() }),
        fetch(`${API_BASE}/lealtad/canjes`, { headers: authHeaders() }),
      ])
      const puntosData = await puntosRes.json()
      const premiosData = await premiosRes.json()
      const canjesData = await canjesRes.json()
      setBalance(puntosData.balance || 0)
      setPremios(premiosData.premios || [])
      setCanjes(canjesData.canjes || [])
    } catch {
      setAlert({ message: 'Error al cargar los premios.', type: 'error' })
    }

    // Detectar estancia activa del usuario
    try {
      const codigosRes = await fetch(`${API_BASE}/lealtad/codigos`, { headers: authHeaders() })
      const codigosData = await codigosRes.json()
      const hoy = new Date().toISOString().split('T')[0]
      const codigos = codigosData.codigos || []

      // Buscar codigo con estadía activa hoy, si no la próxima
      const codigoActivo = codigos.find(c => c.fecha_ingreso <= hoy && c.fecha_salida >= hoy)
        || codigos.find(c => c.fecha_ingreso > hoy)

      if (codigoActivo) {
        setEstanciaActiva({
          ubicacion: codigoActivo.ubicacion,
          fecha_check_in: codigoActivo.fecha_ingreso,
          fecha_check_out: codigoActivo.fecha_salida,
          estado: 'aprobado',
        })
      } else {
        setEstanciaActiva(null)
      }
    } catch { /* no bloquear si falla */ }
  }

  function filtrarPremios(tab) {
    const lower = (s) => s.toLowerCase()
    if (tab === 'consumibles') {
      const filtered = premios.filter(p => lower(p.nombre).includes('café') || lower(p.nombre).includes('comida') || lower(p.nombre).includes('bebida'))
      return filtered.length ? filtered : premios
    }
    if (tab === 'merch') {
      const filtered = premios.filter(p => lower(p.nombre).includes('merch') || lower(p.nombre).includes('playera') || lower(p.nombre).includes('taza'))
      return filtered.length ? filtered : premios
    }
    const descuentos = premios.filter(p => lower(p.nombre).includes('descuento') || lower(p.nombre).includes('%') || (!lower(p.nombre).includes('café') && !lower(p.nombre).includes('merch')))
    return descuentos.length ? descuentos : premios
  }

  async function confirmarCanje() {
    if (!modal) return
    setCanjeLoading(true)
    try {
      const res = await fetch(`${API_BASE}/lealtad/canjes`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          premio_id: modal.id,
          ubicacion: estanciaActiva?.ubicacion || null,
        }),
      })
      const data = await res.json()
      setModal(null)
      if (!res.ok) {
        setAlert({ message: data.error || 'Error al realizar el canje.', type: 'error' })
        return
      }
      setAlert({ message: `¡Canje exitoso! Tu código: ${data.codigo}`, type: 'success' })
      cargarDatos()
    } catch {
      setAlert({ message: 'Error de conexión.', type: 'error' })
    } finally {
      setCanjeLoading(false)
    }
  }

  const currentPremios = filtrarPremios(activeTab)
  const tabs = ['consumibles', 'descuentos', 'merch', 'historial']

  function formatFecha(str) {
    if (!str) return '—'
    return new Date(str).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function labelTab(tab) {
    if (tab === 'historial') return 'Historial'
    return tab.charAt(0).toUpperCase() + tab.slice(1)
  }

  return (
    <div className="app-body">
      <div className="app-page">
        <AppTopbar />
        <AppLogoCircle />

        <h1 className="app-section-title">Beneficios</h1>

        <Alert message={alert?.message} type={alert?.type} />

        <div className="app-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`app-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {labelTab(tab)}
            </button>
          ))}
        </div>

        <div className="tab-panel">
          {activeTab === 'historial' ? (
            <>
              <p className="tab-desc">Tus canjes realizados con sus códigos de uso.</p>
              {canjes.length === 0 ? (
                <p className="empty-list">Aún no has realizado ningún canje.</p>
              ) : (
                <div className="canjes-historial-list">
                  {canjes.map((c) => (
                    <div key={c.id} className="canje-item">
                      <div className="canje-item-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#2D6A50" strokeWidth="1.5" width="28" height="28">
                          <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"/>
                          <polyline points="12 3 12 15"/>
                          <path d="M4 7l8-4 8 4"/>
                        </svg>
                      </div>
                      <div className="canje-item-info">
                        <p className="canje-item-nombre">{c.premios?.nombre || `Premio #${c.premio_id}`}</p>
                        <p className="canje-item-codigo">Código: <strong>{c.codigo_unico}</strong></p>
                        <p className="canje-item-meta">{formatFecha(c.fecha || c.fecha_canje || c.created_at)} &bull; {c.puntos_utilizados} pts</p>
                        {c.ubicacion && <p className="canje-item-meta" style={{ color: '#2D6A50', fontWeight: 600 }}>📍 {c.ubicacion}</p>}
                      </div>
                      <span className={`badge-canje ${c.estado}`}>{c.estado}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="tab-desc">Descubre increíbles y deliciosos productos que podrás canjear con tus puntos.</p>
              <p className="puntos-disponibles">Puntos disponibles para canje: <strong>{balance}</strong></p>

              <div className="premios-list">
                {currentPremios.length === 0 ? (
                  <p className="empty-list">No hay premios disponibles.</p>
                ) : (
                  currentPremios.map((p) => {
                    const alcance = p.puntos_necesarios > 0
                      ? Math.min((balance / p.puntos_necesarios) * 100, 100)
                      : 100
                    const listo = balance >= p.puntos_necesarios
                    return (
                      <div
                        key={p.id}
                        className={`premio-item ${listo ? '' : 'disabled'}`}
                        onClick={() => {
                          if (listo) setModal({ id: p.id, nombre: p.nombre, puntos: p.puntos_necesarios })
                        }}
                      >
                        {/* Fila principal: icono + info + puntos */}
                        <div className="premio-item-row">
                          <div className="premio-icon">
                            {p.imagen_url ? (
                              <img
                                src={p.imagen_url}
                                alt={p.nombre}
                                style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 14 }}
                              />
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="#2D6A50" strokeWidth="1.5" width="36" height="36">
                                <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                                <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
                              </svg>
                            )}
                          </div>
                          <div className="premio-info">
                            <p className="premio-nombre">{p.nombre}</p>
                            {p.descripcion && <p className="premio-desc">{p.descripcion}</p>}
                          </div>
                          <div className="premio-pts">{p.puntos_necesarios}pt</div>
                        </div>

                        {/* Barra de alcance */}
                        <div className="premio-progress-wrap">
                          <div className="premio-progress-track">
                            <div
                              className={`premio-progress-fill ${listo ? 'premio-progress-fill--listo' : ''}`}
                              style={{ width: `${alcance}%` }}
                            />
                          </div>
                          <span className={`premio-progress-label ${listo ? 'premio-progress-label--listo' : ''}`}>
                            {listo
                              ? '¡Listo!'
                              : `${balance.toLocaleString()} / ${p.puntos_necesarios.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <BottomNav />

      {modal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal-card">
            <h3 className="modal-title">Confirmar Canje</h3>
            <p className="modal-desc">
              ¿Deseas canjear &ldquo;{modal.nombre}&rdquo; por <strong>{modal.puntos} pts</strong>? Te quedarán <strong>{balance - modal.puntos} pts</strong>.
            </p>

            {/* Ubicación auto-detectada */}
            {estanciaActiva ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#f0fff4', border: '1.5px solid #9ae6b4',
                borderRadius: 12, padding: '12px 16px', marginBottom: 18,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: '#2D6A50',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: '.72rem', color: '#276749', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    Entrega en tu ubicación
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '.95rem', color: '#1a2e22' }}>{estanciaActiva.ubicacion}</div>
                  <div style={{ fontSize: '.75rem', color: '#38a169', marginTop: 1 }}>
                    {new Date(estanciaActiva.fecha_check_in + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                    {' → '}
                    {new Date(estanciaActiva.fecha_check_out + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <span style={{
                      marginLeft: 8, background: estanciaActiva.estado === 'aprobado' ? '#c6f6d5' : '#fefcbf',
                      color: estanciaActiva.estado === 'aprobado' ? '#276749' : '#744210',
                      borderRadius: 6, padding: '1px 7px', fontWeight: 700
                    }}>{estanciaActiva.estado}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: '.83rem', color: '#c53030' }}>
                No tienes reservas activas o próximas. El premio se registrará sin ubicación de entrega.
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn-ch-primary modal-confirm-btn" onClick={confirmarCanje} disabled={canjeLoading}>
                {canjeLoading ? <span className="ch-spinner" /> : <span className="btn-text">Canjear</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
