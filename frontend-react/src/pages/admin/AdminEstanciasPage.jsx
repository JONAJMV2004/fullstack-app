import { useState, useEffect } from 'react'
import { useAuth, API_BASE } from '../../context/AuthContext'
import AdminLayout from '../../components/AdminLayout'

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminEstanciasPage() {
  const { authHeaders } = useAuth()
  const [estancias, setEstancias] = useState([])
  const [filtro, setFiltro] = useState('')
  const [alert, setAlert] = useState(null)
  const [editTarget, setEditTarget] = useState(null)

  async function cargar() {
    try {
      const res = await fetch(`${API_BASE}/admin/estancias`, { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEstancias(data.estancias)
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  useEffect(() => { cargar() }, [])

  const filtered = filtro ? estancias.filter(e => e.estado === filtro) : estancias

  async function handleEditSave() {
    if (!editTarget) return
    try {
      const puntosAGuardar = editTarget.estado === 'rechazado' ? 0 : parseInt(editTarget.puntos_ganados) || 0
      const res = await fetch(`${API_BASE}/admin/estancias/${editTarget.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ estado: editTarget.estado, puntos_ganados: puntosAGuardar }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const msg = editTarget.estado === 'aprobado' && parseInt(editTarget.puntos_ganados) > 0
        ? `Estancia aprobada. Se asignaron ${editTarget.puntos_ganados} puntos al usuario.`
        : 'Estancia actualizada.'
      setAlert({ type: 'success', msg })
      setEditTarget(null)
      cargar()
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  function openApprove(e) {
    setEditTarget({ id: e.id, estado: 'aprobado', puntos_ganados: e.puntos_ganados || '' })
  }

  return (
    <AdminLayout title="Estancias">
      {alert && <div className={`admin-alert show ${alert.type}`}>{alert.msg}</div>}

      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>Estancias registradas</h2>
          <select className="admin-input" value={filtro} onChange={e => setFiltro(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Usuario</th><th>Check-in</th><th>Check-out</th><th>Puntos</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {!filtered.length ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#718096', padding: 24 }}>Sin estancias.</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>
                    {e.usuarios?.nombre || e.usuario_id}
                    <br /><small style={{ color: '#718096' }}>{e.usuarios?.email || ''}</small>
                  </td>
                  <td>{formatDate(e.fecha_check_in)}</td>
                  <td>{formatDate(e.fecha_check_out)}</td>
                  <td><strong>{e.puntos_ganados ?? 0}</strong></td>
                  <td><span className={`badge ${e.estado}`}>{e.estado}</span></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    {e.estado === 'pendiente' && (
                      <button className="btn-admin success sm" onClick={() => openApprove(e)}>Aprobar</button>
                    )}
                    <button className="btn-admin secondary sm" onClick={() => setEditTarget({ id: e.id, estado: e.estado, puntos_ganados: e.puntos_ganados ?? 0 })}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editTarget && (
        <div className="admin-modal-backdrop show" onClick={() => setEditTarget(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>{editTarget.estado === 'aprobado' ? 'Aprobar' : 'Editar'} estancia #{editTarget.id}</h3>
            {editTarget.estado === 'aprobado' && (
              <p style={{ fontSize: '.88rem', color: '#718096' }}>
                Al aprobar se asignarán los puntos indicados al usuario automáticamente.
              </p>
            )}
            <div className="admin-form-group">
              <label>Estado</label>
              <select className="admin-input" value={editTarget.estado} onChange={e => setEditTarget(prev => ({ ...prev, estado: e.target.value }))}>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label>Puntos a asignar</label>
              <input
                className="admin-input"
                type="number"
                min="0"
                placeholder="Ej. 150"
                value={editTarget.estado === 'rechazado' ? 0 : editTarget.puntos_ganados}
                disabled={editTarget.estado === 'rechazado'}
                onChange={e => setEditTarget(prev => ({ ...prev, puntos_ganados: e.target.value }))}
              />
              {editTarget.estado === 'rechazado' && (
                <small style={{ color: '#e53e3e' }}>No se pueden asignar puntos a una estancia rechazada.</small>
              )}
            </div>
            <div className="admin-modal-actions">
              <button className="btn-admin secondary" onClick={() => setEditTarget(null)}>Cancelar</button>
              <button className="btn-admin primary" onClick={handleEditSave}>
                {editTarget.estado === 'aprobado' ? 'Aprobar y asignar puntos' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
