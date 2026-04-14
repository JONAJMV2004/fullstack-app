import { useState, useEffect } from 'react'
import { useAuth, API_BASE } from '../../context/AuthContext'
import AdminLayout from '../../components/AdminLayout'

function formatDate(str) {
  if (!str) return '—'
  const s = String(str).substring(0, 10)
  return new Date(s + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatCard({ label, value, sub, color = '#2D6A50' }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '18px 20px',
      border: '1.5px solid #e2e8f0', flex: 1, minWidth: 140,
    }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function BarChart({ items, valueKey, labelKey, colorPositivo = '#2D6A50' }) {
  if (!items.length) return <p style={{ color: '#a0aec0', fontSize: '0.85rem' }}>Sin datos para mostrar.</p>
  const max = Math.max(...items.map(i => i[valueKey]))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, idx) => (
        <div key={idx}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.83rem' }}>
            <span style={{ fontWeight: 600, color: '#2d3748' }}>{item[labelKey]}</span>
            <span style={{ fontWeight: 700, color: colorPositivo }}>{item[valueKey].toLocaleString()}</span>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: 99, height: 8, overflow: 'hidden' }}>
            <div style={{
              width: `${max > 0 ? (item[valueKey] / max) * 100 : 0}%`,
              height: '100%', borderRadius: 99,
              background: colorPositivo,
              transition: 'width .4s ease',
            }} />
          </div>
          {item.sub && <div style={{ fontSize: '0.72rem', color: '#a0aec0', marginTop: 2 }}>{item.sub}</div>}
        </div>
      ))}
    </div>
  )
}

export default function AdminPuntosPage() {
  const { authHeaders } = useAuth()
  const [tab, setTab] = useState('analitica')
  const [alert, setAlert] = useState(null)

  // ── Analítica ──
  const ahora = new Date()
  const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`
  const [mes, setMes] = useState(mesActual)
  const [analitica, setAnalitica] = useState(null)
  const [loadingAnalitica, setLoadingAnalitica] = useState(false)

  // ── Ajustar puntos ──
  const [puntos, setPuntos] = useState([])
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [fPuntos, setFPuntos] = useState('')
  const [fDesc, setFDesc] = useState('')

  async function cargarAnalitica(m) {
    setLoadingAnalitica(true)
    try {
      const res = await fetch(`${API_BASE}/admin/analitica?mes=${m}`, { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnalitica(data)
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    } finally {
      setLoadingAnalitica(false)
    }
  }

  async function cargarPuntos() {
    try {
      const res = await fetch(`${API_BASE}/admin/puntos`, { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPuntos(data.puntos)
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  useEffect(() => { cargarAnalitica(mes) }, [])
  useEffect(() => {
    if (tab === 'historial') cargarPuntos()
  }, [tab])

  async function buscarUsuario() {
    if (!searchQ.trim()) return
    try {
      const res = await fetch(`${API_BASE}/admin/usuarios`, { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const q = searchQ.toLowerCase()
      setSearchResults(data.usuarios.filter(u =>
        (u.nombre || '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      ))
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  async function selectUser(u) {
    const balance = puntos.filter(p => p.usuario_id === u.id).reduce((s, p) => s + p.puntos, 0)
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
      setAlert({ type: 'success', msg: `${pts > 0 ? '+' : ''}${pts} puntos aplicados. Nuevo balance: ${(selectedUser.balance || 0) + pts} pts` })
      setSelectedUser(prev => ({ ...prev, balance: (prev.balance || 0) + pts }))
      setFPuntos('')
      setFDesc('')
      cargarPuntos()
    } catch (err) { setAlert({ type: 'error', msg: err.message }) }
  }

  const mesLabel = (m) => {
    const [y, mo] = m.split('-')
    return new Date(parseInt(y), parseInt(mo) - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  }

  return (
    <AdminLayout title="Puntos">
      {alert && <div className={`admin-alert show ${alert.type}`}>{alert.msg}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e2e8f0' }}>
        {[
          { key: 'analitica', label: 'Analítica' },
          { key: 'ajustar',   label: 'Ajustar Puntos' },
          { key: 'historial', label: 'Historial' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 20px', fontSize: '0.88rem', fontWeight: 600,
            color: tab === t.key ? '#2D6A50' : '#718096',
            borderBottom: tab === t.key ? '2px solid #2D6A50' : '2px solid transparent',
            marginBottom: -2, transition: 'all .2s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: ANALÍTICA ── */}
      {tab === 'analitica' && (
        <div>
          {/* Selector de mes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ fontWeight: 600, color: '#4a5568', fontSize: '0.88rem' }}>Período:</label>
              <input
                type="month"
                className="admin-input"
                value={mes}
                max={mesActual}
                onChange={e => setMes(e.target.value)}
                style={{ maxWidth: 180 }}
              />
              <button className="btn-admin primary" onClick={() => cargarAnalitica(mes)}>
                Ver reporte
              </button>
            </div>
            {analitica && (
              <span style={{ fontSize: '0.82rem', color: '#718096' }}>
                Mostrando: <strong style={{ color: '#2D6A50' }}>{mesLabel(mes)}</strong>
              </span>
            )}
          </div>

          {loadingAnalitica ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#a0aec0' }}>Cargando analítica...</div>
          ) : analitica && (
            <>
              {/* Resumen del mes */}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
                <StatCard label="Estadías del mes" value={analitica.resumen.estadiasMes} sub="códigos canjeados" />
                <StatCard label="Puntos asignados" value={analitica.resumen.puntosMes.toLocaleString()} sub="este mes" color="#2D6A50" />
                <StatCard label="Total emitidos" value={analitica.resumen.totalEmitidos.toLocaleString()} sub="histórico" color="#4f46e5" />
                <StatCard label="Total canjeados" value={analitica.resumen.totalCanjeados.toLocaleString()} sub="en premios" color="#dc2626" />
              </div>

              {/* Tendencia últimos 6 meses */}
              <div className="admin-panel" style={{ marginBottom: 20 }}>
                <div className="admin-panel-header">
                  <h2>Tendencia de estadías — últimos 6 meses</h2>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <BarChart
                    items={analitica.tendencia.map(t => ({ ...t, label: t.label, sub: `${t.puntos} pts` }))}
                    valueKey="estadias"
                    labelKey="label"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 20 }}>

                {/* Ubicaciones más activas del mes */}
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <h2>Ubicaciones más activas</h2>
                    <span style={{ fontSize: '0.78rem', color: '#718096' }}>{mesLabel(mes)}</span>
                  </div>
                  <div style={{ padding: '16px 20px' }}>
                    <BarChart
                      items={analitica.ubicacionesMes.map(u => ({
                        ...u,
                        label: u.ubicacion,
                        value: u.estadias,
                        sub: `${u.noches} noches · ${u.puntos} pts asignados`,
                      }))}
                      valueKey="estadias"
                      labelKey="label"
                    />
                  </div>
                </div>

                {/* Top usuarios por puntos (global) */}
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <h2>Usuarios con más puntos</h2>
                    <span style={{ fontSize: '0.78rem', color: '#718096' }}>histórico</span>
                  </div>
                  <div style={{ padding: '16px 20px' }}>
                    <BarChart
                      items={analitica.topUsuarios.map(u => ({
                        ...u,
                        label: u.nombre,
                        value: u.total,
                        sub: `${u.movimientos} estadía${u.movimientos !== 1 ? 's' : ''}`,
                      }))}
                      valueKey="total"
                      labelKey="label"
                      colorPositivo="#4f46e5"
                    />
                  </div>
                </div>
              </div>

              {/* Puntos asignados este mes — detalle */}
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h2>Puntos asignados este mes</h2>
                  <span style={{ fontSize: '0.78rem', color: '#718096' }}>{analitica.asignadosMes.length} movimientos</span>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Usuario</th><th>Email</th><th>Descripción</th><th>Puntos</th><th>Fecha</th></tr>
                    </thead>
                    <tbody>
                      {!analitica.asignadosMes.length ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', color: '#718096', padding: 24 }}>Sin movimientos en este período.</td></tr>
                      ) : analitica.asignadosMes.map((p, i) => (
                        <tr key={i}>
                          <td><strong>{p.usuarios?.nombre || '—'}</strong></td>
                          <td style={{ color: '#718096', fontSize: '0.83rem' }}>{p.usuarios?.email || '—'}</td>
                          <td>{p.descripcion}</td>
                          <td style={{ color: '#16a34a', fontWeight: 700 }}>+{p.puntos}</td>
                          <td>{formatDate(p.fecha)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB: AJUSTAR PUNTOS ── */}
      {tab === 'ajustar' && (
        <div>
          <div className="admin-panel" style={{ marginBottom: 20 }}>
            <div className="admin-panel-header"><h2>Buscar usuario</h2></div>
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
                    <div key={u.id} onClick={() => selectUser(u)} className="admin-search-result">
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
                    <p style={{ fontSize: '.85rem', color: '#2D6A50', fontWeight: 600, marginTop: 4 }}>{selectedUser.balance} pts actuales</p>
                  </div>
                  <button className="btn-admin secondary sm" onClick={() => setSelectedUser(null)}>Cambiar</button>
                </div>
              )}
            </div>
          </div>

          {selectedUser && (
            <div className="admin-panel">
              <div className="admin-panel-header"><h2>Asignar / ajustar puntos</h2></div>
              <form onSubmit={handleSubmit} className="admin-form">
                <div className="admin-form-group">
                  <label>Puntos (positivo = agregar, negativo = quitar)</label>
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
        </div>
      )}

      {/* ── TAB: HISTORIAL ── */}
      {tab === 'historial' && (
        <div className="admin-panel">
          <div className="admin-panel-header"><h2>Todos los movimientos</h2></div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Usuario</th><th>Email</th><th>Puntos</th><th>Descripción</th><th>Fecha</th></tr>
              </thead>
              <tbody>
                {!puntos.length ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#718096', padding: 24 }}>Sin movimientos.</td></tr>
                ) : puntos.map(p => (
                  <tr key={p.id}>
                    <td>{p.usuarios?.nombre || p.usuario_id}</td>
                    <td style={{ color: '#718096', fontSize: '0.83rem' }}>{p.usuarios?.email || '—'}</td>
                    <td style={{ color: p.puntos >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
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
      )}
    </AdminLayout>
  )
}
