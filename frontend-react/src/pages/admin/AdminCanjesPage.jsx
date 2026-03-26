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

  const filtered = filtro ? canjes.filter(c => c.estado === filtro) : canjes

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
              Usuario: {validResult.usuarios?.nombre || ''} ({validResult.usuarios?.email || ''}) · Premio: {validResult.premios?.nombre || ''} · Fecha: {formatDate(validResult.fecha_canje)}
            </span>
          </div>
        )}
      </div>

      {/* History */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>Historial de canjes</h2>
          <select className="admin-input" value={filtro} onChange={e => setFiltro(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
          </select>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Usuario</th><th>Premio</th><th>Código</th><th>Estado</th><th>Fecha</th></tr>
            </thead>
            <tbody>
              {!filtered.length ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#718096', padding: 24 }}>Sin canjes.</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>
                    {c.usuarios?.nombre || c.usuario_id}
                    <br /><small style={{ color: '#718096' }}>{c.usuarios?.email || ''}</small>
                  </td>
                  <td>{c.premios?.nombre || c.premio_id}</td>
                  <td><code className="admin-code">{c.codigo_unico}</code></td>
                  <td><span className={`badge ${c.estado}`}>{c.estado}</span></td>
                  <td>{formatDate(c.fecha_canje)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
