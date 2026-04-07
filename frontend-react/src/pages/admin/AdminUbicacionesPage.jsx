import { useState, useEffect } from 'react'
import { useAuth, API_BASE } from '../../context/AuthContext'
import AdminLayout from '../../components/AdminLayout'

export default function AdminUbicacionesPage() {
  const { authHeaders } = useAuth()
  const [ubicaciones, setUbicaciones] = useState([])
  const [alert, setAlert] = useState(null)

  const [fNombre, setFNombre] = useState('')

  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function cargar() {
    try {
      const res = await fetch(`${API_BASE}/admin/ubicaciones`, { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUbicaciones(data.ubicaciones)
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  useEffect(() => { cargar() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setAlert(null)
    try {
      const res = await fetch(`${API_BASE}/admin/ubicaciones`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ nombre: fNombre.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAlert({ type: 'success', msg: 'Ubicación creada.' })
      setFNombre('')
      cargar()
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  async function handleEditSave() {
    if (!editTarget) return
    setAlert(null)
    try {
      const res = await fetch(`${API_BASE}/admin/ubicaciones/${editTarget.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ nombre: editTarget.nombre }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAlert({ type: 'success', msg: 'Ubicación actualizada.' })
      setEditTarget(null)
      cargar()
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  async function handleToggleActiva(ubicacion) {
    setAlert(null)
    try {
      const res = await fetch(`${API_BASE}/admin/ubicaciones/${ubicacion.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ activa: !ubicacion.activa }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      cargar()
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setAlert(null)
    try {
      const res = await fetch(`${API_BASE}/admin/ubicaciones/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAlert({ type: 'success', msg: 'Ubicación eliminada.' })
      setDeleteTarget(null)
      cargar()
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  return (
    <AdminLayout title="Ubicaciones">
      {alert && <div className={`admin-alert show ${alert.type}`}>{alert.msg}</div>}

      {/* Crear ubicación */}
      <div className="admin-panel" style={{ marginBottom: 20 }}>
        <div className="admin-panel-header"><h2>Agregar ubicación</h2></div>
        <form onSubmit={handleCreate} className="admin-form">
          <div className="admin-form-group">
            <label>Nombre</label>
            <input
              className="admin-input"
              required
              value={fNombre}
              onChange={e => setFNombre(e.target.value)}
              placeholder="Ej. Punta 1"
            />
          </div>
          <button className="btn-admin primary" type="submit">Agregar</button>
        </form>
      </div>

      {/* Tabla */}
      <div className="admin-panel">
        <div className="admin-panel-header"><h2>Ubicaciones del catálogo</h2></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {!ubicaciones.length ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#718096', padding: 24 }}>Sin ubicaciones.</td></tr>
              ) : ubicaciones.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td><strong>{u.nombre}</strong></td>
                  <td>
                    <span className={`badge ${u.activa ? 'activo' : 'inactivo'}`}>
                      {u.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-admin secondary sm" onClick={() => setEditTarget({ ...u })}>
                        Renombrar
                      </button>
                      <button
                        className={`btn-admin sm ${u.activa ? 'danger' : 'secondary'}`}
                        onClick={() => handleToggleActiva(u)}
                      >
                        {u.activa ? 'Desactivar' : 'Activar'}
                      </button>
                      <button className="btn-admin danger sm" onClick={() => setDeleteTarget(u)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal editar nombre */}
      {editTarget && (
        <div className="admin-modal-backdrop show" onClick={() => setEditTarget(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>Renombrar ubicación</h3>
            <div className="admin-form-group">
              <label>Nombre</label>
              <input
                className="admin-input"
                value={editTarget.nombre}
                onChange={e => setEditTarget(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </div>
            <div className="admin-modal-actions">
              <button className="btn-admin secondary" onClick={() => setEditTarget(null)}>Cancelar</button>
              <button className="btn-admin primary" onClick={handleEditSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {deleteTarget && (
        <div className="admin-modal-backdrop show" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>Confirmar eliminación</h3>
            <p>¿Eliminar &quot;{deleteTarget.nombre}&quot;? Esta acción no se puede deshacer.</p>
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
