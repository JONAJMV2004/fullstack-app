import { useState, useEffect } from 'react'
import { useAuth, API_BASE } from '../../context/AuthContext'
import AdminLayout from '../../components/AdminLayout'

function formatDate(str) {
  if (!str) return '—'
  return new Date(str + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function generarCodigo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function AdminCodigosPage() {
  const { authHeaders } = useAuth()
  const [codigos, setCodigos] = useState([])
  const [ubicaciones, setUbicaciones] = useState([])
  const [filtro, setFiltro] = useState('')
  const [alert, setAlert] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [copiadoId, setCopiadoId] = useState(null)

  function copiarLink(c) {
    const url = `${window.location.origin}/home?codigo=${encodeURIComponent(c.codigo)}`
    const ingreso = formatDate(c.fecha_ingreso)
    const salida = formatDate(c.fecha_salida)
    const mensaje =
      `Hola, gracias por hospedarte en Cielito Home ✨\n\n` +
      `¿Ya conoces nuestro nuevo programa de lealtad? \n\n🤍 Te invitamos a ingresar y comenzar a acumular y canjear tus puntos por increíbles premios durante tus estancias.
      \n\n` +
      `Aqui tienes tu codigo de estadía para acumular tus puntos:\n\n` +
      `📍 Ubicación: ${c.ubicacion}\n` +
      `📅 Llegada: ${ingreso}  |  📅Salida: ${salida}\n` +
      `🌙 Noches: ${c.noches}  |  ⭐ Puntos: ${c.puntos}\n\n` +
      `Ingresa al siguiente enlace y tus puntos se agregaran automaticamente:\n` +
      `${url}`

    navigator.clipboard.writeText(mensaje).then(() => {
      setCopiadoId(c.codigo)
      setTimeout(() => setCopiadoId(null), 2500)
    })
  }

  const [form, setForm] = useState({
    codigo: '',
    ubicacion: '',
    fecha_ingreso: '',
    fecha_salida: '',
    noches: '',
    puntos: '',
  })
  const [formLoading, setFormLoading] = useState(false)
  const [conflicto, setConflicto] = useState(null)

  useEffect(() => {
    const { ubicacion, fecha_ingreso, fecha_salida } = form
    if (!ubicacion || !fecha_ingreso || !fecha_salida) {
      setConflicto(null)
      return
    }
    const choque = codigos.find(c =>
      c.ubicacion?.toLowerCase() === ubicacion.toLowerCase() &&
      c.fecha_ingreso < fecha_salida &&
      c.fecha_salida > fecha_ingreso
    )
    setConflicto(choque || null)
  }, [form.ubicacion, form.fecha_ingreso, form.fecha_salida, codigos])

  async function cargar() {
    try {
      const [codigosRes, ubicacionesRes] = await Promise.all([
        fetch(`${API_BASE}/admin/codigos`, { headers: authHeaders() }),
        fetch(`${API_BASE}/admin/ubicaciones`, { headers: authHeaders() }),
      ])
      const codigosData = await codigosRes.json()
      const ubicacionesData = await ubicacionesRes.json()
      if (!codigosRes.ok) throw new Error(codigosData.error)
      setCodigos(codigosData.codigos)
      setUbicaciones((ubicacionesData.ubicaciones || []).filter(u => u.activa))
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    }
  }

  useEffect(() => { cargar() }, [])

  const filtered = filtro ? codigos.filter(c => c.estatus === filtro) : codigos

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }
      // Auto-calcular noches si hay ambas fechas
      if ((name === 'fecha_ingreso' || name === 'fecha_salida') && next.fecha_ingreso && next.fecha_salida) {
        const diff = Math.round(
          (new Date(next.fecha_salida) - new Date(next.fecha_ingreso)) / 86400000
        )
        if (diff > 0) next.noches = String(diff)
      }
      return next
    })
  }

  async function handleCreate(e) {
    e.preventDefault()
    setAlert(null)

    if (!form.codigo || !form.ubicacion || !form.fecha_ingreso || !form.fecha_salida || !form.noches || !form.puntos) {
      setAlert({ type: 'error', msg: 'Todos los campos son requeridos.' })
      return
    }

    if (parseInt(form.noches) <= 0) {
      setAlert({ type: 'error', msg: 'Las noches deben ser mayor a 0.' })
      return
    }

    setFormLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/codigos`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          codigo: form.codigo.trim().toUpperCase(),
          ubicacion: form.ubicacion.trim(),
          fecha_ingreso: form.fecha_ingreso,
          fecha_salida: form.fecha_salida,
          noches: parseInt(form.noches),
          puntos: parseInt(form.puntos),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAlert({ type: 'success', msg: `Código "${data.codigo.codigo}" creado con éxito.` })
      setForm({ codigo: '', ubicacion: '', fecha_ingreso: '', fecha_salida: '', noches: '', puntos: '' })
      setShowForm(false)
      cargar()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete(id, codigo) {
    if (!window.confirm(`¿Eliminar el código "${codigo}"?`)) return
    try {
      const res = await fetch(`${API_BASE}/admin/codigos/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAlert({ type: 'success', msg: 'Código eliminado.' })
      cargar()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    }
  }

  return (
    <AdminLayout title="Códigos">
      {alert && <div className={`admin-alert show ${alert.type}`}>{alert.msg}</div>}

      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>Códigos de estadía</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <select className="admin-input" value={filtro} onChange={e => setFiltro(e.target.value)} style={{ maxWidth: 180 }}>
              <option value="">Todos</option>
              <option value="disponible">Disponibles</option>
              <option value="canjeado">Canjeados</option>
            </select>
            <button className="btn-admin primary" onClick={() => { setShowForm(v => !v); setAlert(null) }}>
              {showForm ? 'Cancelar' : '+ Nuevo Código'}
            </button>
          </div>
        </div>

        {/* Formulario de creación */}
        {showForm && (
          <form onSubmit={handleCreate} style={{ padding: '20px', background: '#f8fffe', borderRadius: 12, marginBottom: 20, border: '1.5px solid #e2f0eb' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#2D6A50' }}>Crear nuevo código</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div className="admin-form-group">
                <label>Código</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="admin-input"
                    name="codigo"
                    value={form.codigo}
                    onChange={handleFormChange}
                    placeholder="Ej: CIELITO25"
                    maxLength={30}
                    style={{ textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}
                    required
                  />
                  <button
                    type="button"
                    className="btn-admin secondary"
                    onClick={() => setForm(prev => ({ ...prev, codigo: generarCodigo() }))}
                    title="Generar código aleatorio"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Generar
                  </button>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Ubicación</label>
                <select className="admin-input" name="ubicacion" value={form.ubicacion} onChange={handleFormChange} required>
                  <option value="">Selecciona una ubicación</option>
                  {ubicaciones.map(u => (
                    <option key={u.id} value={u.nombre}>{u.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label>Fecha ingreso</label>
                <input className="admin-input" type="date" name="fecha_ingreso" value={form.fecha_ingreso} onChange={handleFormChange} required />
              </div>

              <div className="admin-form-group">
                <label>Fecha salida</label>
                <input className="admin-input" type="date" name="fecha_salida" value={form.fecha_salida} min={form.fecha_ingreso || undefined} onChange={handleFormChange} required />
              </div>

              <div className="admin-form-group">
                <label>Noches</label>
                <input className="admin-input" type="number" name="noches" value={form.noches} onChange={handleFormChange} min="1" placeholder="Ej: 3" required />
              </div>

              <div className="admin-form-group">
                <label>Puntos a asignar</label>
                <input className="admin-input" type="number" name="puntos" value={form.puntos} onChange={handleFormChange} min="0" placeholder="Ej: 150" required />
              </div>
            </div>

            {conflicto && (
              <div style={{
                margin: '16px 0 0',
                background: '#fff5f5', border: '1.5px solid #fc8181',
                borderLeft: '4px solid #e53e3e',
                borderRadius: 10, padding: '12px 16px',
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
                <div style={{ fontSize: '.85rem', color: '#742a2a' }}>
                  <strong>Ubicación ocupada en esas fechas</strong>
                  <div style={{ marginTop: 4, color: '#9b2c2c' }}>
                    {conflicto.usuarios
                      ? <><strong>{conflicto.usuarios.nombre}</strong> ({conflicto.usuarios.email})</>
                      : <strong>Código sin canjear aún</strong>
                    }
                    {' — '}
                    {formatDate(conflicto.fecha_ingreso)} al {formatDate(conflicto.fecha_salida)}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="submit" className="btn-admin primary" disabled={formLoading}>
                {formLoading ? 'Creando...' : 'Crear Código'}
              </button>
            </div>
          </form>
        )}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Ubicación</th>
                <th>Ingreso</th>
                <th>Salida</th>
                <th>Noches</th>
                <th>Puntos</th>
                <th>Estatus</th>
                <th>Canjeado por</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!filtered.length ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#718096', padding: 24 }}>Sin códigos.</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td><strong style={{ letterSpacing: 1 }}>{c.codigo}</strong></td>
                  <td>{c.ubicacion}</td>
                  <td>{formatDate(c.fecha_ingreso)}</td>
                  <td>{formatDate(c.fecha_salida)}</td>
                  <td>{c.noches}</td>
                  <td><strong>{c.puntos}</strong></td>
                  <td>
                    <span className={`badge ${c.estatus === 'canjeado' ? 'aprobado' : 'pendiente'}`}>
                      {c.estatus}
                    </span>
                  </td>
                  <td>
                    {c.usuarios
                      ? <>{c.usuarios.nombre}<br /><small style={{ color: '#718096' }}>{c.usuarios.email}</small></>
                      : <span style={{ color: '#718096' }}>—</span>
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {c.estatus === 'disponible' && (
                        <button
                          className="btn-admin sm"
                          onClick={() => copiarLink(c)}
                          style={{
                            background: copiadoId === c.codigo ? '#16a34a' : '#2D6A50',
                            color: '#fff', border: 'none', borderRadius: 6,
                            padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem',
                            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
                            transition: 'background .2s',
                          }}
                        >
                          {copiadoId === c.codigo ? (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              ¡Copiado!
                            </>
                          ) : (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                              Copiar link
                            </>
                          )}
                        </button>
                      )}
                      {c.estatus === 'disponible' && (
                        <button className="btn-admin danger sm" onClick={() => handleDelete(c.id, c.codigo)}>
                          Eliminar
                        </button>
                      )}
                    </div>
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
