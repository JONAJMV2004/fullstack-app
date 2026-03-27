import { useState, useEffect, useRef } from 'react'
import { useAuth, API_BASE } from '../../context/AuthContext'
import AdminLayout from '../../components/AdminLayout'

function ImagenUploader({ premioId, currentUrl, onUploaded, authHeaders }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl || null)
  const inputRef = useRef()

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const form = new FormData()
      form.append('imagen', file)
      const headers = authHeaders()
      delete headers['Content-Type']
      const res = await fetch(`${API_BASE}/admin/premios/${premioId}/imagen`, {
        method: 'POST',
        headers,
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUploaded(data.imagen_url)
    } catch (err) {
      alert('Error al subir imagen: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        onClick={() => inputRef.current.click()}
        style={{
          width: 90, height: 90, borderRadius: 12, border: '2px dashed #2D6A50',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', overflow: 'hidden', background: '#f0faf5',
        }}
      >
        {uploading ? (
          <span style={{ fontSize: 12, color: '#2D6A50' }}>Subiendo…</span>
        ) : preview ? (
          <img src={preview} alt="premio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="#2D6A50" strokeWidth="1.5" width="32" height="32">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        )}
      </div>
      <span style={{ fontSize: 11, color: '#718096' }}>Haz clic para subir</span>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  )
}

export default function AdminPremiosPage() {
  const { authHeaders } = useAuth()
  const [premios, setPremios] = useState([])
  const [alert, setAlert] = useState(null)

  const [fNombre, setFNombre] = useState('')
  const [fPuntos, setFPuntos] = useState('')
  const [fDisp, setFDisp]   = useState('')
  const [newPremioId, setNewPremioId] = useState(null)

  const [editTarget, setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function cargar() {
    try {
      const res  = await fetch(`${API_BASE}/admin/premios`, { headers: authHeaders() })
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
      const res  = await fetch(`${API_BASE}/admin/premios`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ nombre: fNombre.trim(), puntos_necesarios: parseInt(fPuntos), disponibilidad: parseInt(fDisp) || 0 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAlert({ type: 'success', msg: 'Premio creado. Ahora puedes subir la imagen.' })
      setFNombre(''); setFPuntos(''); setFDisp('')
      setNewPremioId(data.premio.id)
      cargar()
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  async function handleEditSave() {
    if (!editTarget) return
    try {
      const res  = await fetch(`${API_BASE}/admin/premios/${editTarget.id}`, {
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
      const res  = await fetch(`${API_BASE}/admin/premios/${deleteTarget.id}`, { method: 'DELETE', headers: authHeaders() })
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

      {/* Crear premio */}
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

        {/* Uploader aparece justo después de crear */}
        {newPremioId && (
          <div style={{ marginTop: 16, padding: '16px', background: '#f0faf5', borderRadius: 8 }}>
            <p style={{ margin: '0 0 8px', fontSize: 14, color: '#2D6A50', fontWeight: 600 }}>
              Sube la imagen para el nuevo premio:
            </p>
            <ImagenUploader
              premioId={newPremioId}
              authHeaders={authHeaders}
              onUploaded={() => { setNewPremioId(null); cargar() }}
            />
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="admin-panel">
        <div className="admin-panel-header"><h2>Premios disponibles</h2></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Imagen</th><th>Nombre</th><th>Puntos</th><th>Disponibilidad</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {!premios.length ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#718096', padding: 24 }}>Sin premios.</td></tr>
              ) : premios.map(p => (
                <tr key={p.id}>
                  <td>
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.nombre} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <div style={{ width: 48, height: 48, background: '#e2e8f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="1.5" width="22" height="22">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </div>
                    )}
                  </td>
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

      {/* Modal editar */}
      {editTarget && (
        <div className="admin-modal-backdrop show" onClick={() => setEditTarget(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>Editar premio</h3>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
              <ImagenUploader
                premioId={editTarget.id}
                currentUrl={editTarget.imagen_url}
                authHeaders={authHeaders}
                onUploaded={(url) => { setEditTarget(prev => ({ ...prev, imagen_url: url })); cargar() }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="admin-form-group">
                  <label>Nombre</label>
                  <input className="admin-input" value={editTarget.nombre} onChange={e => setEditTarget(p => ({ ...p, nombre: e.target.value }))} />
                </div>
                <div className="admin-form-group">
                  <label>Puntos necesarios</label>
                  <input className="admin-input" type="number" value={editTarget.puntos_necesarios} onChange={e => setEditTarget(p => ({ ...p, puntos_necesarios: e.target.value }))} />
                </div>
                <div className="admin-form-group">
                  <label>Disponibilidad</label>
                  <input className="admin-input" type="number" value={editTarget.disponibilidad} onChange={e => setEditTarget(p => ({ ...p, disponibilidad: e.target.value }))} />
                </div>
              </div>
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
