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
  const [activeTab, setActiveTab] = useState('descuentos')
  const [modal, setModal] = useState(null)
  const [canjeLoading, setCanjeLoading] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    try {
      const [puntosRes, premiosRes] = await Promise.all([
        fetch(`${API_BASE}/lealtad/puntos`, { headers: authHeaders() }),
        fetch(`${API_BASE}/lealtad/premios`, { headers: authHeaders() }),
      ])
      const puntosData = await puntosRes.json()
      const premiosData = await premiosRes.json()
      setBalance(puntosData.balance || 0)
      setPremios(premiosData.premios || [])
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
  const tabs = ['consumibles', 'descuentos', 'merch']

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
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="tab-panel">
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
                      <img src={p.imagen_url} alt={p.nombre} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10 }} />
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
