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
        body: JSON.stringify({ premio_id: modal.id }),
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
                        <p className="canje-item-meta">{formatFecha(c.fecha)} &bull; {c.puntos_utilizados} pts</p>
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
                  currentPremios.map((p) => (
                    <div
                      key={p.id}
                      className={`premio-item ${balance < p.puntos_necesarios ? 'disabled' : ''}`}
                      onClick={() => {
                        if (balance >= p.puntos_necesarios) {
                          setModal({ id: p.id, nombre: p.nombre, puntos: p.puntos_necesarios })
                        }
                      }}
                    >
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
                        <p className="premio-desc">{p.nombre}</p>
                      </div>
                      <div className="premio-pts">{p.puntos_necesarios}pt</div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <BottomNav />

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-card">
            <h3 className="modal-title">Confirmar Canje</h3>
            <p className="modal-desc">
              ¿Deseas canjear &ldquo;{modal.nombre}&rdquo; por {modal.puntos} punto(s)? Te quedarán {balance - modal.puntos} puntos.
            </p>
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
