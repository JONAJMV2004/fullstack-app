import { useState, useEffect } from 'react'
import { useAuth, API_BASE } from '../../context/AuthContext'
import AdminLayout from '../../components/AdminLayout'

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ESTADO_CONFIG = {
  ocupada:      { label: 'Ocupada',      color: '#e53e3e', bg: '#fff5f5', border: '#fed7d7' },
  reservada:    { label: 'Reservada',    color: '#d69e2e', bg: '#fffff0', border: '#fefcbf' },
  disponible:   { label: 'Disponible',   color: '#38a169', bg: '#f0fff4', border: '#c6f6d5' },
  desactivada:  { label: 'Desactivada',  color: '#a0aec0', bg: '#f7fafc', border: '#e2e8f0' },
}

function calcNights(checkIn, checkOut) {
  const d1 = new Date(checkIn), d2 = new Date(checkOut)
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
}

function BadgeEstado({ estado }) {
  const map = {
    aprobado:  { bg: '#c6f6d5', color: '#276749' },
    pendiente: { bg: '#fefcbf', color: '#744210' },
    rechazado: { bg: '#fed7d7', color: '#9b2c2c' },
  }
  const s = map[estado] || { bg: '#e2e8f0', color: '#4a5568' }
  return (
    <span style={{
      fontSize: '.72rem', fontWeight: 700, borderRadius: 6,
      padding: '2px 8px', background: s.bg, color: s.color,
      textTransform: 'capitalize'
    }}>{estado}</span>
  )
}

export default function AdminUbicacionesPage() {
  const { authHeaders } = useAuth()
  const [ubicaciones, setUbicaciones] = useState([])
  const [ocupacion, setOcupacion] = useState([])
  const [alert, setAlert] = useState(null)

  const [fNombre, setFNombre] = useState('')

  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function cargar() {
    try {
      const [resUb, resOc] = await Promise.all([
        fetch(`${API_BASE}/admin/ubicaciones`, { headers: authHeaders() }),
        fetch(`${API_BASE}/admin/ubicaciones/ocupacion`, { headers: authHeaders() }),
      ])
      const dataUb = await resUb.json()
      const dataOc = await resOc.json()
      if (!resUb.ok) throw new Error(dataUb.error)
      setUbicaciones(dataUb.ubicaciones)
      if (resOc.ok) setOcupacion(dataOc.ubicaciones || [])
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

      {/* Ocupación actual */}
      <div className="admin-panel" style={{ marginBottom: 20 }}>
        <div className="admin-panel-header">
          <h2>Estado de ocupación</h2>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => (
              <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.8rem', color: '#4a5568' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, display: 'inline-block', flexShrink: 0 }} />
                {cfg.label}
              </span>
            ))}
          </div>
        </div>

        {!ocupacion.length ? (
          <p style={{ padding: '16px 20px', color: '#718096', margin: 0 }}>Sin ubicaciones registradas.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, padding: '16px 20px' }}>
            {ocupacion.map(ub => {
              const hoy = new Date().toISOString().split('T')[0]
              const esDesactivada = !ub.activa
              const estadoKey = esDesactivada ? 'desactivada' : (ub.estado_ocupacion || 'disponible')
              const cfg = ESTADO_CONFIG[estadoKey]

              const estanciaActual = ub.estancias?.find(e =>
                e.fecha_check_in <= hoy && e.fecha_check_out >= hoy
              )
              const proximas = ub.estancias?.filter(e => e.fecha_check_in > hoy) || []

              return (
                <div key={ub.id} style={{
                  border: `2px solid ${cfg.border}`,
                  borderTop: `4px solid ${cfg.color}`,
                  borderRadius: 10,
                  background: '#fff',
                  overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                }}>
                  {/* Header de la tarjeta */}
                  <div style={{ padding: '12px 16px', background: cfg.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#2d3748' }}>{ub.nombre}</div>
                      <div style={{ fontSize: '.75rem', color: '#718096', marginTop: 2 }}>
                        {ub.estancias?.length || 0} reserva{ub.estancias?.length !== 1 ? 's' : ''} vigente{ub.estancias?.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{
                        background: cfg.color, color: '#fff', borderRadius: 20,
                        padding: '3px 11px', fontSize: '.75rem', fontWeight: 700,
                      }}>{cfg.label}</span>
                      {esDesactivada && (
                        <span style={{ fontSize: '.7rem', color: '#a0aec0' }}>No acepta reservas</span>
                      )}
                    </div>
                  </div>

                  {/* Cuerpo */}
                  <div style={{ padding: '12px 16px' }}>

                    {/* Estancia actual */}
                    {estanciaActual && (
                      <div style={{ marginBottom: proximas.length ? 12 : 0 }}>
                        <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#e53e3e', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                          Huésped actual
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '.9rem', color: '#2d3748' }}>
                              {estanciaActual.usuarios?.nombre || 'Usuario desconocido'}
                            </div>
                            <div style={{ fontSize: '.78rem', color: '#718096' }}>{estanciaActual.usuarios?.email || '—'}</div>
                          </div>
                          <BadgeEstado estado={estanciaActual.estado} />
                        </div>
                        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                          <div style={{ background: '#f7fafc', borderRadius: 6, padding: '6px 10px' }}>
                            <div style={{ fontSize: '.68rem', color: '#a0aec0', fontWeight: 600, textTransform: 'uppercase' }}>Check-in</div>
                            <div style={{ fontSize: '.85rem', color: '#2d3748', fontWeight: 600 }}>{formatDate(estanciaActual.fecha_check_in)}</div>
                          </div>
                          <div style={{ background: '#f7fafc', borderRadius: 6, padding: '6px 10px' }}>
                            <div style={{ fontSize: '.68rem', color: '#a0aec0', fontWeight: 600, textTransform: 'uppercase' }}>Check-out</div>
                            <div style={{ fontSize: '.85rem', color: '#2d3748', fontWeight: 600 }}>{formatDate(estanciaActual.fecha_check_out)}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 6, fontSize: '.78rem', color: '#718096' }}>
                          {calcNights(estanciaActual.fecha_check_in, estanciaActual.fecha_check_out)} noche{calcNights(estanciaActual.fecha_check_in, estanciaActual.fecha_check_out) !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}

                    {/* Separador */}
                    {estanciaActual && proximas.length > 0 && (
                      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />
                    )}

                    {/* Próximas reservas */}
                    {proximas.length > 0 && (
                      <div>
                        <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#d69e2e', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                          Próximas reservas ({proximas.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {proximas.map((e, i) => (
                            <div key={e.id} style={{
                              background: '#f7fafc', borderRadius: 8, padding: '8px 10px',
                              borderLeft: `3px solid ${e.estado === 'aprobado' ? '#38a169' : '#d69e2e'}`,
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <div style={{ fontWeight: 600, fontSize: '.85rem', color: '#2d3748' }}>
                                  {e.usuarios?.nombre || 'Usuario'}
                                </div>
                                <BadgeEstado estado={e.estado} />
                              </div>
                              <div style={{ fontSize: '.78rem', color: '#718096', marginBottom: 2 }}>{e.usuarios?.email || '—'}</div>
                              <div style={{ fontSize: '.78rem', color: '#4a5568' }}>
                                {formatDate(e.fecha_check_in)} → {formatDate(e.fecha_check_out)}
                                <span style={{ color: '#a0aec0', marginLeft: 6 }}>
                                  ({calcNights(e.fecha_check_in, e.fecha_check_out)} noche{calcNights(e.fecha_check_in, e.fecha_check_out) !== 1 ? 's' : ''})
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sin actividad */}
                    {!estanciaActual && proximas.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '12px 0', color: '#a0aec0', fontSize: '.85rem' }}>
                        {esDesactivada ? 'Ubicación desactivada' : 'Sin reservas activas ni próximas'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
