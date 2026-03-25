import { useState, useEffect } from 'react'
import { useAuth, API_BASE } from '../context/AuthContext'

export default function DashboardPage() {
  const { token, user, authHeaders, saveSession, clearSession } = useAuth()
  const [alert, setAlert] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [puntosTotal, setPuntosTotal] = useState('—')
  const [totalEstancias, setTotalEstancias] = useState('—')
  const [totalCanjes, setTotalCanjes] = useState('—')
  const [estancias, setEstancias] = useState([])
  const [editName, setEditName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Form state
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [puntosGanados, setPuntosGanados] = useState('')

  // Loading states
  const [saveLoading, setSaveLoading] = useState(false)
  const [estanciaLoading, setEstanciaLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function showAlert(message, type = 'error') {
    setAlert({ message, type })
  }

  useEffect(() => {
    loadProfile()
    loadPuntos()
    loadEstancias()
  }, [])

  async function loadProfile() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() })
      const data = await res.json()
      if (res.status === 401 || res.status === 403) { clearSession(); return }
      if (!res.ok) throw new Error(data.error)
      setCurrentUser(data.user)
      setEditName(data.user.name)
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
        setTotalEstancias(data.totalEstancias || 0)
        setTotalCanjes(data.totalCanjes || 0)
      }
    } catch { /* silent */ }
  }

  async function loadEstancias() {
    try {
      const res = await fetch(`${API_BASE}/lealtad/estancias`, { headers: authHeaders() })
      const data = await res.json()
      if (res.ok) setEstancias(data.estancias || [])
    } catch { /* silent */ }
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    setAlert(null)
    if (!editName.trim()) { showAlert('Name cannot be empty.'); return }

    const body = {}
    if (editName !== currentUser.name) body.name = editName
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
      saveSession(token, { ...user, name: data.user.name })
      setCurrentUser(data.user)
      setEditPassword('')
      showAlert('Profile updated successfully.', 'success')
    } catch {
      showAlert('Network error. Please try again.')
    } finally {
      setSaveLoading(false)
    }
  }

  async function handleEstanciaSubmit(e) {
    e.preventDefault()
    setAlert(null)
    setEstanciaLoading(true)
    try {
      const res = await fetch(`${API_BASE}/lealtad/estancias`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ check_in: checkIn, check_out: checkOut, puntos_ganados: parseInt(puntosGanados) }),
      })
      const data = await res.json()
      if (!res.ok) { showAlert(data.error || 'Error al registrar estancia.'); return }
      showAlert('Estancia registrada exitosamente.', 'success')
      setCheckIn(''); setCheckOut(''); setPuntosGanados('')
      loadPuntos(); loadEstancias()
    } catch {
      showAlert('Error de conexión.')
    } finally {
      setEstanciaLoading(false)
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

        {/* Puntos */}
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
                <span className="meta-label">Estancias</span>
                <span className="meta-value">{totalEstancias}</span>
              </div>
              <div className="points-meta-item">
                <span className="meta-label">Canjes</span>
                <span className="meta-value">{totalCanjes}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Registrar Estancia */}
        <section className="dash-section">
          <div className="section-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <h2>Registrar Estancia</h2>
          </div>
          <form className="dash-form" onSubmit={handleEstanciaSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="check-in">Check-in</label>
                <input type="datetime-local" id="check-in" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="check-out">Check-out</label>
                <input type="datetime-local" id="check-out" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="puntos-ganados">Puntos Ganados</label>
              <input type="number" id="puntos-ganados" placeholder="Ej. 150" min="1" value={puntosGanados} onChange={(e) => setPuntosGanados(e.target.value)} required />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-auto" disabled={estanciaLoading}>
                {estanciaLoading ? <span className="spinner" /> : <span className="btn-text">Registrar</span>}
              </button>
            </div>
          </form>
        </section>

        {/* Historial */}
        <section className="dash-section">
          <div className="section-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v4H3z" /><path d="M3 9h18v4H3z" /><path d="M3 15h18v4H3z" /></svg>
            <h2>Historial de Estancias</h2>
          </div>
          <div className="list-container">
            {estancias.length === 0 ? (
              <div className="list-empty">No hay estancias registradas.</div>
            ) : (
              estancias.map((est, i) => (
                <div key={i} className="list-item">
                  <div className="list-item-left">
                    <span className="list-item-title">Estancia #{i + 1}</span>
                    <span className="list-item-sub">{new Date(est.check_in).toLocaleDateString()} - {new Date(est.check_out).toLocaleDateString()}</span>
                  </div>
                  <div className="list-item-right">
                    <span className={`badge-status badge-${est.estado || 'confirmada'}`}>{est.estado || 'confirmada'}</span>
                    <span>+{est.puntos_ganados} pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
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
