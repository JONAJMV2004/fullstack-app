import { useState, useEffect } from 'react'
import { useAuth, API_BASE } from '../context/AuthContext'

function formatFecha(str) {
  if (!str) return '—'
  return new Date(str + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function agruparPorMes(items, campoFecha) {
  const grupos = {}
  items.forEach(item => {
    const fecha = new Date(item[campoFecha])
    const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    const label = fecha.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    if (!grupos[key]) grupos[key] = { key, label, items: [] }
    grupos[key].items.push(item)
  })
  return Object.values(grupos).sort((a, b) => b.key.localeCompare(a.key))
}

function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <svg
          key={star}
          width="22" height="22" viewBox="0 0 24 24"
          fill={(hover || value) >= star ? '#f59e0b' : 'none'}
          stroke={(hover || value) >= star ? '#f59e0b' : '#cbd5e1'}
          strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ cursor: readonly ? 'default' : 'pointer', transition: 'fill .15s, stroke .15s' }}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

function EstadiaCard({ estadia, authHeaders, onUpdated }) {
  const [editando, setEditando] = useState(false)
  const [calificacion, setCalificacion] = useState(estadia.calificacion || 0)
  const [comentario, setComentario] = useState(estadia.comentario || '')
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)

  const noches = estadia.noches

  async function handleGuardar() {
    if (!calificacion) { setAlert('Selecciona una calificación.'); return }
    setLoading(true)
    setAlert(null)
    try {
      const res = await fetch(`${API_BASE}/lealtad/codigos/${estadia.id}/resena`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ calificacion, comentario }),
      })
      const data = await res.json()
      if (!res.ok) { setAlert(data.error || 'Error al guardar.'); return }
      setEditando(false)
      onUpdated && onUpdated(data.codigo)
    } catch {
      setAlert('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  const tieneResena = estadia.calificacion > 0

  return (
    <div style={{
      borderRadius: 14, border: '1.5px solid #e2e8f0',
      background: '#fff', overflow: 'hidden', marginBottom: 14,
    }}>
      {/* Cabecera de la estadia */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: '#f0fdf4',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{estadia.ubicacion}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                {formatFecha(estadia.fecha_ingreso)} → {formatFecha(estadia.fecha_salida)}
                <span style={{ marginLeft: 8, color: '#94a3b8' }}>· {noches} noche{noches !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          <div style={{
            background: '#f0fdf4', color: '#16a34a', borderRadius: 20,
            padding: '4px 12px', fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            +{estadia.puntos} pts
          </div>
        </div>
      </div>

      {/* Sección reseña */}
      <div style={{ padding: '12px 16px' }}>
        {!editando && tieneResena ? (
          // Mostrar reseña existente
          <div>
            <StarRating value={estadia.calificacion} readonly />
            {estadia.comentario && (
              <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: 8, fontStyle: 'italic' }}>
                "{estadia.comentario}"
              </p>
            )}
            <button
              onClick={() => setEditando(true)}
              style={{
                marginTop: 8, background: 'none', border: 'none', cursor: 'pointer',
                color: '#2D6A50', fontSize: '0.78rem', fontWeight: 600, padding: 0,
              }}
            >
              Editar reseña
            </button>
          </div>
        ) : !editando && !tieneResena ? (
          // Sin reseña aún
          <button
            onClick={() => setEditando(true)}
            style={{
              background: 'none', border: '1.5px dashed #cbd5e1', borderRadius: 10,
              width: '100%', padding: '10px', cursor: 'pointer', color: '#64748b',
              fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Calificar esta estadía
          </button>
        ) : (
          // Formulario de reseña
          <div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Tu calificación</div>
              <StarRating value={calificacion} onChange={setCalificacion} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Comentario (opcional)</div>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="¿Cómo fue tu experiencia?"
                maxLength={300}
                rows={3}
                style={{
                  width: '100%', borderRadius: 10, border: '1.5px solid #e2e8f0',
                  padding: '10px 12px', fontSize: '0.85rem', resize: 'none',
                  boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
                  color: '#1e293b',
                }}
              />
            </div>
            {alert && (
              <div style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: 8 }}>{alert}</div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setEditando(false); setCalificacion(estadia.calificacion || 0); setComentario(estadia.comentario || '') }}
                style={{
                  background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 8,
                  padding: '7px 14px', fontSize: '0.82rem', cursor: 'pointer', color: '#64748b',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={loading || !calificacion}
                style={{
                  background: '#2D6A50', color: '#fff', border: 'none', borderRadius: 8,
                  padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  opacity: loading || !calificacion ? 0.6 : 1,
                }}
              >
                {loading ? 'Guardando...' : 'Guardar reseña'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { token, user, authHeaders, saveSession, clearSession } = useAuth()
  const [alert, setAlert] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [puntosTotal, setPuntosTotal] = useState('—')
  const [totalEstancias, setTotalEstancias] = useState('—')
  const [totalCanjes, setTotalCanjes] = useState('—')
  const [estadias, setEstadias] = useState([])
  const [editName, setEditName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function showAlert(message, type = 'error') {
    setAlert({ message, type })
  }

  useEffect(() => {
    loadProfile()
    loadPuntos()
    loadEstadias()
  }, [])

  async function loadProfile() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() })
      const data = await res.json()
      if (res.status === 401 || res.status === 403) { clearSession(); return }
      if (!res.ok) throw new Error(data.error)
      setCurrentUser(data.user)
      setEditName(data.user.nombre || data.user.name)
    } catch (err) {
      showAlert(`Failed to load profile: ${err.message}`)
    }
  }

  async function loadPuntos() {
    try {
      const res = await fetch(`${API_BASE}/lealtad/puntos`, { headers: authHeaders() })
      const data = await res.json()
      if (res.ok) {
        setPuntosTotal(data.balance || 0)
        setTotalEstancias(data.resumen?.total_codigos || 0)
        setTotalCanjes(data.resumen?.total_canjes || 0)
      }
    } catch { /* silent */ }
  }

  async function loadEstadias() {
    try {
      const res = await fetch(`${API_BASE}/lealtad/codigos`, { headers: authHeaders() })
      const data = await res.json()
      if (res.ok) setEstadias(data.codigos || [])
    } catch { /* silent */ }
  }

  function handleResenaActualizada(codigoActualizado) {
    setEstadias(prev => prev.map(e => e.id === codigoActualizado.id ? { ...e, ...codigoActualizado } : e))
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    setAlert(null)
    if (!editName.trim()) { showAlert('Name cannot be empty.'); return }

    const body = {}
    if (editName !== (currentUser.nombre || currentUser.name)) body.nombre = editName
    if (editPassword) body.password = editPassword
    if (Object.keys(body).length === 0) { showAlert('No changes to save.', 'success'); return }
    if (editPassword && editPassword.length < 6) { showAlert('Password must be at least 6 characters.'); return }

    setSaveLoading(true)
    try {
      const res = await fetch(`${API_BASE}/users/${currentUser.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { showAlert(data.error || 'Failed to update profile.'); return }
      saveSession(token, { ...user, nombre: data.user.nombre || data.user.name, name: data.user.nombre || data.user.name })
      setCurrentUser(data.user)
      setEditPassword('')
      showAlert('Profile updated successfully.', 'success')
    } catch {
      showAlert('Network error. Please try again.')
    } finally {
      setSaveLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true)
    try {
      const res = await fetch(`${API_BASE}/users/${currentUser.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) { setShowDeleteModal(false); showAlert(data.error || 'Failed to delete account.'); return }
      clearSession()
    } catch {
      setShowDeleteModal(false)
      showAlert('Network error. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const grupos = agruparPorMes(estadias, 'created_at')

  return (
    <div className="dashboard-body">
      <header className="navbar">
        <div className="navbar-brand">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#6366f1" /><path d="M12 20a8 8 0 1 1 16 0 8 8 0 0 1-16 0zm8-5v5l3.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
          <span>Programa de Lealtad</span>
        </div>
        <div className="navbar-right">
          <span className="nav-greeting">{currentUser ? `Hello, ${currentUser.name.split(' ')[0]}` : 'Hola, ...'}</span>
          <button className="btn btn-outline btn-sm" onClick={clearSession}>Cerrar Sesión</button>
        </div>
      </header>

      <main className="dashboard-main">
        {alert && <div className={`alert ${alert.type}`} role="alert">{alert.message}</div>}

        {/* Perfil */}
        <section className="dash-section">
          <div className="section-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
            <h2>Mi Perfil</h2>
          </div>
          {currentUser && (
            <div className="profile-card">
              <div className="profile-avatar-wrap">
                {currentUser.avatar_url ? (
                  <img className="profile-avatar" src={currentUser.avatar_url} alt="Avatar" />
                ) : (
                  <div className="avatar-fallback">{currentUser.name.charAt(0).toUpperCase()}</div>
                )}
              </div>
              <div className="profile-info">
                <h1 className="profile-name">{currentUser.name}</h1>
                <p className="profile-email">{currentUser.email}</p>
                <span className="badge">{currentUser.provider || 'local'}</span>
              </div>
            </div>
          )}
        </section>

        {/* Puntos resumen */}
        <section className="dash-section">
          <div className="section-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            <h2>Mis Puntos</h2>
          </div>
          <div className="points-banner">
            <div className="points-total">
              <span className="points-number">{puntosTotal}</span>
              <span className="points-label">puntos acumulados</span>
            </div>
            <div className="points-meta">
              <div className="points-meta-item">
                <span className="meta-label">Estadías</span>
                <span className="meta-value">{totalEstancias}</span>
              </div>
              <div className="points-meta-item">
                <span className="meta-label">Canjes</span>
                <span className="meta-value">{totalCanjes}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Historial de estadías */}
        <section className="dash-section">
          <div className="section-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            <h2>Mis Estadías</h2>
          </div>

          {grupos.length === 0 ? (
            <p style={{ color: '#718096', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>
              Aún no tienes estadías registradas.
            </p>
          ) : grupos.map(grupo => (
            <div key={grupo.key} style={{ marginBottom: 28 }}>
              {/* Etiqueta del período */}
              <div style={{
                fontSize: '0.75rem', fontWeight: 700, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: 1.2,
                marginBottom: 12, paddingBottom: 8,
                borderBottom: '2px solid #f1f5f9',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {grupo.label}
                <span style={{
                  background: '#e2e8f0', borderRadius: 20, padding: '1px 8px',
                  fontSize: '0.7rem', fontWeight: 700, color: '#64748b',
                }}>
                  {grupo.items.length} estadía{grupo.items.length !== 1 ? 's' : ''}
                </span>
              </div>

              {grupo.items.map(estadia => (
                <EstadiaCard
                  key={estadia.id}
                  estadia={estadia}
                  authHeaders={authHeaders}
                  onUpdated={handleResenaActualizada}
                />
              ))}
            </div>
          ))}
        </section>

        {/* Editar Perfil */}
        <section className="dash-section">
          <div className="section-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            <h2>Editar Perfil</h2>
          </div>
          <form className="dash-form" onSubmit={handleEditSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="edit-name">Nombre Completo</label>
              <input type="text" id="edit-name" placeholder="Tu nombre" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="edit-password">Nueva Contraseña <span className="hint">(dejar en blanco para no cambiar)</span></label>
              <div className="password-wrapper">
                <input type={showPw ? 'text' : 'password'} id="edit-password" placeholder="••••••••" autoComplete="new-password" minLength={6} value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
                <button type="button" className="toggle-pw" aria-label="Mostrar contraseña" onClick={() => setShowPw(!showPw)}>
                  <svg className="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                </button>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-auto" disabled={saveLoading}>
                {saveLoading ? <span className="spinner" /> : <span className="btn-text">Guardar Cambios</span>}
              </button>
            </div>
          </form>
        </section>

        {/* Zona de Peligro */}
        <section className="dash-section danger-section">
          <div className="section-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            <h2 className="danger-title">Zona de Peligro</h2>
          </div>
          <p className="danger-desc">Eliminar tu cuenta es permanente y no se puede deshacer.</p>
          <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>Eliminar mi Cuenta</button>
        </section>
      </main>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}>
          <div className="modal">
            <h3>¿Estás seguro?</h3>
            <p>Esto eliminará permanentemente tu cuenta y todos tus datos.</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={deleteLoading}>
                {deleteLoading ? <span className="spinner" /> : <span className="btn-text">Sí, Eliminar</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
