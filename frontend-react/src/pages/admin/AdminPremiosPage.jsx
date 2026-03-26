import { useState, useEffect } from 'react'
import { useAuth, API_BASE } from '../../context/AuthContext'
import AdminLayout from '../../components/AdminLayout'

export default function AdminPremiosPage() {
  const { authHeaders } = useAuth()
  const [premios, setPremios] = useState([])
  const [alert, setAlert] = useState(null)

  // Create form
  const [fNombre, setFNombre] = useState('')
  const [fPuntos, setFPuntos] = useState('')
  const [fDisp, setFDisp] = useState('')

  // Modals
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function cargar() {
    try {
      const res = await fetch(`${API_BASE}/admin/premios`, { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPremios(data.premios)
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  useEffect(() => { cargar() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setAlert(null)
    try {
      const res = await fetch(`${API_BASE}/admin/premios`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ nombre: fNombre.trim(), puntos_necesarios: parseInt(fPuntos), disponibilidad: parseInt(fDisp) || 0 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAlert({ type: 'success', msg: 'Premio creado.' })
      setFNombre(''); setFPuntos(''); setFDisp('')
      cargar()
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  async function handleEditSave() {
    if (!editTarget) return
    try {
      const res = await fetch(`${API_BASE}/admin/premios/${editTarget.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ nombre: editTarget.nombre, puntos_necesarios: parseInt(editTarget.puntos_necesarios), disponibilidad: parseInt(editTarget.disponibilidad) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAlert({ type: 'success', msg: 'Premio actualizado.' })
      setEditTarget(null)
      cargar()
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      const res = await fetch(`${API_BASE}/admin/premios/${deleteTarget.id}`, { method: 'DELETE', headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAlert({ type: 'success', msg: 'Premio eliminado.' })
      setDeleteTarget(null)
      cargar()
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  return (
    <AdminLayout title="Premios">
      {alert && <div className={`admin-alert show ${alert.type}`}>{alert.msg}</div>}

      {/* Create form */}
      <div className="admin-panel" style={{ marginBottom: 20 }}>
        <div className="admin-panel-header"><h2>Agregar nuevo premio</h2></div>
        <form onSubmit={handleCreate} className="admin-form">
          <div className="admin-form-group">
            <label>Nombre</label>
            <input className="admin-input" required value={fNombre} onChange={e => setFNombre(e.target.value)} placeholder="Nombre del premio" />
          </div>
          <div className="admin-form-group">
            <label>Puntos necesarios</label>
            <input className="admin-input" type="number" required value={fPuntos} onChange={e => setFPuntos(e.target.value)} placeholder="500" />
          </div>
          <div className="admin-form-group">
            <label>Disponibilidad</label>
            <input className="admin-input" type="number" value={fDisp} onChange={e => setFDisp(e.target.value)} placeholder="10" />
          </div>
          <button className="btn-admin primary" type="submit">Agregar</button>
        </form>
      </div>

      {/* Premios table */}
      <div className="admin-panel">
        <div className="admin-panel-header"><h2>Premios disponibles</h2></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Puntos</th><th>Disponibilidad</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {!premios.length ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#718096', padding: 24 }}>Sin premios.</td></tr>
              ) : premios.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td><strong>{p.nombre}</strong></td>
                  <td>{p.puntos_necesarios} pts</td>
                  <td><span className={`badge ${p.disponibilidad > 0 ? 'activo' : 'inactivo'}`}>{p.disponibilidad}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-admin secondary sm" onClick={() => setEditTarget({ ...p })}>Editar</button>
                      <button className="btn-admin danger sm" onClick={() => setDeleteTarget(p)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editTarget && (
        <div className="admin-modal-backdrop show" onClick={() => setEditTarget(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>Editar premio</h3>
            <div className="admin-form-group">
              <label>Nombre</label>
              <input className="admin-input" value={editTarget.nombre} onChange={e => setEditTarget(prev => ({ ...prev, nombre: e.target.value }))} />
            </div>
            <div className="admin-form-group">
              <label>Puntos necesarios</label>
              <input className="admin-input" type="number" value={editTarget.puntos_necesarios} onChange={e => setEditTarget(prev => ({ ...prev, puntos_necesarios: e.target.value }))} />
            </div>
            <div className="admin-form-group">
              <label>Disponibilidad</label>
              <input className="admin-input" type="number" value={editTarget.disponibilidad} onChange={e => setEditTarget(prev => ({ ...prev, disponibilidad: e.target.value }))} />
            </div>
            <div className="admin-modal-actions">
              <button className="btn-admin secondary" onClick={() => setEditTarget(null)}>Cancelar</button>
              <button className="btn-admin primary" onClick={handleEditSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="admin-modal-backdrop show" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>Confirmar eliminación</h3>
            <p>¿Eliminar &quot;{deleteTarget.nombre}&quot;?</p>
            <div className="admin-modal-actions">
              <button className="btn-admin secondary" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="btn-admin danger" onClick={handleDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
