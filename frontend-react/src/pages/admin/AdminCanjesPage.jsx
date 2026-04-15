import { useState, useEffect } from 'react'
import { useAuth, API_BASE } from '../../context/AuthContext'
import AdminLayout from '../../components/AdminLayout'

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminCanjesPage() {
  const { authHeaders } = useAuth()
  const [canjes, setCanjes] = useState([])
  const [filtro, setFiltro] = useState('')
  const [alert, setAlert] = useState(null)

  // Validate form
  const [codigo, setCodigo] = useState('')
  const [validResult, setValidResult] = useState(null)

  async function cargar() {
    try {
      const res = await fetch(`${API_BASE}/admin/canjes`, { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCanjes(data.canjes)
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  useEffect(() => { cargar() }, [])

  const pendientes = canjes.filter(c => c.estado === 'pendiente')
  const filtered = filtro ? canjes.filter(c => c.estado === filtro) : canjes

  async function handleUpdateEstado(id, estado) {
    setAlert(null)
    try {
      const res = await fetch(`${API_BASE}/admin/canjes/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ estado }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const msgs = { aprobado: 'aceptado', rechazado: 'rechazado', entregado: 'marcado como entregado' }
      setAlert({ type: 'success', msg: `Canje ${msgs[estado] || estado} correctamente.` })
      cargar()
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  async function handleValidar(e) {
    e.preventDefault()
    setAlert(null)
    setValidResult(null)
    try {
      const res = await fetch(`${API_BASE}/admin/canjes/validar`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ codigo: codigo.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setValidResult(data.canje)
      setCodigo('')
      cargar()
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  return (
    <AdminLayout title="Canjes">
      {alert && <div className={`admin-alert show ${alert.type}`}>{alert.msg}</div>}

      {/* Validate code */}
      <div className="admin-panel" style={{ marginBottom: 20 }}>
        <div className="admin-panel-header"><h2>Validar código de canje</h2></div>
        <form onSubmit={handleValidar} style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="admin-input"
              placeholder="Código único (ej: ABCD1234)"
              value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}
              required
            />
            <button className="btn-admin success" type="submit">Validar</button>
          </div>
        </form>
        {validResult && (
          <div className="admin-valid-result">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38a169" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span>
              Usuario: {validResult.usuarios?.nombre || ''} ({validResult.usuarios?.email || ''}) · Premio: {validResult.premios?.nombre || ''} · Fecha: {formatDate(validResult.fecha || validResult.fecha_canje)}
              {validResult.ubicacion && ` · 📍 ${validResult.ubicacion}`}
            </span>
          </div>
        )}
      </div>

      {/* Solicitudes pendientes agrupadas por ubicación */}
      <div className="admin-panel" style={{ marginBottom: 20 }}>
        <div className="admin-panel-header">
          <h2>Solicitudes pendientes</h2>
          <span style={{ fontSize: '.85rem', color: '#718096' }}>{pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}</span>
        </div>
        {!pendientes.length ? (
          <p style={{ padding: '16px 20px', color: '#718096', margin: 0 }}>No hay solicitudes pendientes.</p>
        ) : (() => {
          // Agrupar por ubicación
          const grupos = {}
          pendientes.forEach(c => {
            const key = c.ubicacion || 'Sin ubicación'
            if (!grupos[key]) grupos[key] = []
            grupos[key].push(c)
          })
          return (
            <div style={{ padding: '0 0 8px' }}>
              {Object.entries(grupos).map(([ubicacion, canjesGrupo]) => (
                <div key={ubicacion} style={{ marginBottom: 4 }}>
                  {/* Header de ubicación */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px', background: ubicacion === 'Sin ubicación' ? '#f7fafc' : '#f0fff4',
                    borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0',
                  }}>
                    <span style={{ fontSize: '1rem' }}>{ubicacion === 'Sin ubicación' ? '📦' : '📍'}</span>
                    <span style={{ fontWeight: 700, color: ubicacion === 'Sin ubicación' ? '#718096' : '#2D6A50', fontSize: '.92rem' }}>
                      {ubicacion}
                    </span>
                    <span style={{
                      marginLeft: 'auto', fontSize: '.75rem', fontWeight: 700,
                      background: '#2D6A50', color: '#fff', borderRadius: 20, padding: '1px 9px'
                    }}>{canjesGrupo.length} premio{canjesGrupo.length !== 1 ? 's' : ''} a enviar</span>
                  </div>

                  {/* Canjes de esta ubicación */}
                  {canjesGrupo.map((c) => (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 20px 12px 36px', borderBottom: '1px solid #f0f2f1', gap: 12
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#2d3748', fontSize: '.92rem' }}>
                          {c.usuarios?.nombre || c.usuario_id}
                          <span style={{ fontWeight: 400, color: '#718096', fontSize: '.82rem', marginLeft: 8 }}>{c.usuarios?.email || ''}</span>
                        </div>
                        <div style={{ fontSize: '.85rem', color: '#4a5568', marginTop: 2 }}>
                          Premio: <strong>{c.premios?.nombre || c.premio_id}</strong>
                          <span style={{ color: '#a0aec0', marginLeft: 8 }}>{formatDate(c.fecha || c.fecha_canje)}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button className="btn-admin success sm" onClick={() => handleUpdateEstado(c.id, 'aprobado')}>✓ Aceptar</button>
                        <button className="btn-admin danger sm" onClick={() => handleUpdateEstado(c.id, 'rechazado')}>✕ Rechazar</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      {/* History */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>Historial de canjes</h2>
          <select className="admin-input" value={filtro} onChange={e => setFiltro(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="entregado">Entregado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Usuario</th><th>Premio</th><th>Ubicación</th><th>Código</th><th>Estado</th><th>Fecha</th><th></th></tr>
            </thead>
            <tbody>
              {!filtered.length ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#718096', padding: 24 }}>Sin canjes.</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>
                    {c.usuarios?.nombre || c.usuario_id}
                    <br /><small style={{ color: '#718096' }}>{c.usuarios?.email || ''}</small>
                  </td>
                  <td>{c.premios?.nombre || c.premio_id}</td>
                  <td>
                    {c.ubicacion
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: '#2D6A50' }}>📍 {c.ubicacion}</span>
                      : <span style={{ color: '#a0aec0' }}>—</span>
                    }
                  </td>
                  <td><code className="admin-code">{c.codigo_unico}</code></td>
                  <td><span className={`badge ${c.estado}`}>{c.estado}</span></td>
                  <td>{formatDate(c.fecha || c.fecha_canje)}</td>
                  <td>
                    {c.estado === 'aprobado' && (
                      <button
                        className="btn-admin sm"
                        style={{ background: '#6366f1', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}
                        onClick={() => handleUpdateEstado(c.id, 'entregado')}
                      >
                        📦 Entregar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
