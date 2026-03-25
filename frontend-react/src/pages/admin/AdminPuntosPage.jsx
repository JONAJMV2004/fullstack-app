import { useState, useEffect } from 'react'
import { useAuth, API_BASE } from '../../context/AuthContext'
import AdminLayout from '../../components/AdminLayout'

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminPuntosPage() {
  const { authHeaders } = useAuth()
  const [puntos, setPuntos] = useState([])
  const [alert, setAlert] = useState(null)

  // User search
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)

  // Form
  const [fPuntos, setFPuntos] = useState('')
  const [fDesc, setFDesc] = useState('')

  async function cargarPuntos() {
    try {
      const res = await fetch(`${API_BASE}/admin/puntos`, { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPuntos(data.puntos)
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  useEffect(() => { cargarPuntos() }, [])

  async function buscarUsuario() {
    if (!searchQ.trim()) return
    try {
      const res = await fetch(`${API_BASE}/admin/usuarios`, { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const q = searchQ.toLowerCase()
      const filtered = data.usuarios.filter(u =>
        (u.nombre || '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      )
      setSearchResults(filtered)
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  async function selectUser(u) {
    // Calculate balance from points history
    const balance = puntos.filter(p => p.usuario_id === u.id).reduce((sum, p) => sum + p.puntos, 0)
    setSelectedUser({ ...u, balance })
    setSearchResults(null)
    setSearchQ('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)
    const pts = parseInt(fPuntos)
    try {
      const res = await fetch(`${API_BASE}/admin/puntos`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ usuario_id: selectedUser.id, puntos: pts, descripcion: fDesc.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const newBalance = (selectedUser.balance || 0) + pts
      setAlert({ type: 'success', msg: `${pts > 0 ? '+' : ''}${pts} puntos aplicados. Nuevo balance: ${newBalance} pts` })
      setSelectedUser(prev => ({ ...prev, balance: newBalance }))
      setFPuntos('')
      setFDesc('')
      cargarPuntos()
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  return (
    <AdminLayout title="Puntos">
      {alert && <div className={`admin-alert show ${alert.type}`}>{alert.msg}</div>}

      {/* Search user */}
      <div className="admin-panel" style={{ marginBottom: 20 }}>
        <div className="admin-panel-header">
          <h2>Buscar usuario</h2>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="admin-input"
              placeholder="Nombre o email del usuario..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), buscarUsuario())}
              style={{ flex: 1 }}
            />
            <button className="btn-admin primary" onClick={buscarUsuario}>Buscar</button>
          </div>

          {searchResults && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!searchResults.length ? (
                <p style={{ color: '#718096', fontSize: '.9rem' }}>No se encontraron usuarios.</p>
              ) : searchResults.map(u => (
                <div
                  key={u.id}
                  onClick={() => selectUser(u)}
                  className="admin-search-result"
                >
                  <div>
                    <p style={{ fontWeight: 600, color: '#2d3748' }}>{u.nombre || '(sin nombre)'}</p>
                    <p style={{ fontSize: '.82rem', color: '#718096' }}>{u.email}</p>
                  </div>
                  <span className={`badge ${u.tipo_usuario}`}>{u.tipo_usuario}</span>
                </div>
              ))}
            </div>
          )}

          {selectedUser && (
            <div className="admin-selected-user">
              <div>
                <p style={{ fontWeight: 700, color: '#2d3748' }}>{selectedUser.nombre || '(sin nombre)'}</p>
                <p style={{ fontSize: '.82rem', color: '#718096' }}>{selectedUser.email}</p>
                <p style={{ fontSize: '.85rem', color: '#2D6A50', fontWeight: 600, marginTop: 4 }}>{selectedUser.balance} pts</p>
              </div>
              <button className="btn-admin secondary sm" onClick={() => { setSelectedUser(null) }}>Cambiar</button>
            </div>
          )}
        </div>
      </div>

      {/* Points form */}
      {selectedUser && (
        <div className="admin-panel" style={{ marginBottom: 20 }}>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-form-group">
              <label>Puntos (positivo o negativo)</label>
              <input className="admin-input" type="number" required value={fPuntos} onChange={e => setFPuntos(e.target.value)} placeholder="Ej: 100 o -50" />
            </div>
            <div className="admin-form-group">
              <label>Descripción</label>
              <input className="admin-input" required value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Motivo del ajuste" />
            </div>
            <button className="btn-admin primary" type="submit">Aplicar</button>
          </form>
        </div>
      )}

      {/* History table */}
      <div className="admin-panel">
        <div className="admin-panel-header"><h2>Historial de movimientos</h2></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Usuario</th><th>Email</th><th>Puntos</th><th>Descripción</th><th>Fecha</th></tr>
            </thead>
            <tbody>
              {!puntos.length ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#718096', padding: 24 }}>Sin movimientos.</td></tr>
              ) : puntos.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.usuarios?.nombre || p.usuario_id}</td>
                  <td>{p.usuarios?.email || '—'}</td>
                  <td style={{ color: p.puntos >= 0 ? '#38a169' : '#e53e3e', fontWeight: 600 }}>
                    {p.puntos >= 0 ? '+' : ''}{p.puntos}
                  </td>
                  <td>{p.descripcion}</td>
                  <td>{formatDate(p.fecha)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
