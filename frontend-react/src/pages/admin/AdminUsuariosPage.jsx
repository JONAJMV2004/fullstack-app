import { useState, useEffect } from 'react'
import { useAuth, API_BASE } from '../../context/AuthContext'
import AdminLayout from '../../components/AdminLayout'

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ROLES = ['cliente', 'admin', 'staff']

export default function AdminUsuariosPage() {
  const { authHeaders } = useAuth()
  const [usuarios, setUsuarios]     = useState([])
  const [search, setSearch]         = useState('')
  const [alert, setAlert]           = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving]         = useState(false)

  async function cargar() {
    try {
      const res  = await fetch(`${API_BASE}/admin/usuarios`, { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsuarios(data.usuarios)
    } catch (err) { showAlert('error', err.message) }
  }

  useEffect(() => { cargar() }, [])

  const filtered = usuarios.filter(u =>
    (u.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  function showAlert(type, msg) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 4000)
  }

  function openEdit(u) {
    setEditTarget({ ...u, nueva_password: '' })
  }

  async function handleSaveEdit() {
    if (!editTarget) return
    setSaving(true)
    try {
      // 1. Actualizar nombre y rol
      const res = await fetch(`${API_BASE}/admin/usuarios/${editTarget.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ nombre: editTarget.nombre, tipo_usuario: editTarget.tipo_usuario }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // 2. Cambiar contraseña solo si se ingresó una
      if (editTarget.nueva_password && editTarget.nueva_password.length >= 6) {
        const res2 = await fetch(`${API_BASE}/admin/usuarios/${editTarget.id}/password`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ nueva_password: editTarget.nueva_password }),
        })
        const data2 = await res2.json()
        if (!res2.ok) throw new Error(data2.error)
      }

      setEditTarget(null)
      cargar()
      showAlert('success', `Usuario ${editTarget.email} actualizado.`)
    } catch (err) {
      showAlert('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      const res  = await fetch(`${API_BASE}/admin/usuarios/${deleteTarget.id}`, { method: 'DELETE', headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDeleteTarget(null)
      cargar()
      showAlert('success', 'Usuario eliminado.')
    } catch (err) { showAlert('error', err.message) }
  }

  return (
    <AdminLayout title="Usuarios">

      {/* Toast alert */}
      {alert && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14,
          background: alert.type === 'success' ? '#2D6A50' : '#e53e3e',
          color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', maxWidth: 340,
        }}>
          {alert.msg}
        </div>
      )}

      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>Usuarios registrados</h2>
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
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!filtered.length ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#718096', padding: 24 }}>Sin usuarios.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.nombre || '—'}</strong></td>
                  <td style={{ fontSize: '.82rem', color: '#718096' }}>{u.email}</td>
                  <td><span className={`badge ${u.tipo_usuario}`}>{u.tipo_usuario}</span></td>
                  <td style={{ fontSize: '.82rem', color: '#718096' }}>{formatDate(u.fecha_registro)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-admin secondary sm" onClick={() => openEdit(u)}>Editar</button>
                      <button className="btn-admin danger sm"    onClick={() => setDeleteTarget(u)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal editar usuario */}
      {editTarget && (
        <div className="admin-modal-backdrop show" onClick={() => setEditTarget(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>Editar usuario</h3>
            <p style={{ marginTop: -8 }}>{editTarget.email}</p>

            <div className="admin-form-group">
              <label>Nombre</label>
              <input
                className="admin-input"
                value={editTarget.nombre || ''}
                onChange={e => setEditTarget(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Nombre completo"
              />
            </div>

            <div className="admin-form-group">
              <label>Rol</label>
              <select
                className="admin-input"
                value={editTarget.tipo_usuario}
                onChange={e => setEditTarget(p => ({ ...p, tipo_usuario: e.target.value }))}
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label>Nueva contraseña <span style={{ fontWeight: 400, color: '#a0aec0' }}>(dejar vacío para no cambiar)</span></label>
              <input
                className="admin-input"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={editTarget.nueva_password}
                onChange={e => setEditTarget(p => ({ ...p, nueva_password: e.target.value }))}
              />
            </div>

            <div className="admin-modal-actions">
              <button className="btn-admin secondary" onClick={() => setEditTarget(null)}>Cancelar</button>
              <button className="btn-admin primary" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {deleteTarget && (
        <div className="admin-modal-backdrop show" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>Confirmar eliminación</h3>
            <p>¿Eliminar a &quot;{deleteTarget.email}&quot;? Esta acción no se puede deshacer.</p>
            <div className="admin-modal-actions">
              <button className="btn-admin secondary" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="btn-admin danger"    onClick={handleDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
