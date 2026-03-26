import { useState, useEffect } from 'react'
import { useAuth, API_BASE } from '../../context/AuthContext'
import AdminLayout from '../../components/AdminLayout'

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminUsuariosPage() {
  const { authHeaders } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [search, setSearch] = useState('')
  const [alert, setAlert] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function cargar() {
    try {
      const res = await fetch(`${API_BASE}/admin/usuarios`, { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsuarios(data.usuarios)
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  useEffect(() => { cargar() }, [])

  const filtered = usuarios.filter(u =>
    (u.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      const res = await fetch(`${API_BASE}/admin/usuarios/${deleteTarget.id}`, { method: 'DELETE', headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAlert({ type: 'success', msg: 'Usuario eliminado.' })
      setDeleteTarget(null)
      cargar()
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  return (
    <AdminLayout title="Usuarios">
      {alert && <div className={`admin-alert show ${alert.type}`}>{alert.msg}</div>}

      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>Lista de usuarios registrados</h2>
          <input
            className="admin-input"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 260 }}
          />
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>Email</th><th>Tipo</th><th>Proveedor</th><th>Registro</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!filtered.length ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#718096', padding: 24 }}>Sin usuarios.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.nombre || '—'}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${u.tipo_usuario}`}>{u.tipo_usuario}</span></td>
                  <td>{u.provider || 'local'}</td>
                  <td>{formatDate(u.fecha_registro)}</td>
                  <td>
                    <button className="btn-admin danger sm" onClick={() => setDeleteTarget(u)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deleteTarget && (
        <div className="admin-modal-backdrop show" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>Confirmar eliminación</h3>
            <p>¿Eliminar a &quot;{deleteTarget.email}&quot;? Esta acción no se puede deshacer.</p>
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
