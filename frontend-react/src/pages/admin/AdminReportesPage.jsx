import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, API_BASE } from '../../context/AuthContext'
import AdminLayout from '../../components/AdminLayout'

export default function AdminReportesPage() {
  const { authHeaders } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch(`${API_BASE}/admin/reportes`, { headers: authHeaders() })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setStats(data)
      } catch (err) { setError(err.message) }
    }
    cargar()
  }, [])

  const cards = stats ? [
    { label: 'Usuarios registrados', value: stats.totalUsuarios, icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
    { label: 'Total estancias', value: stats.totalEstancias, icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { label: 'Canjes realizados', value: stats.totalCanjes, icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2' },
    { label: 'Puntos emitidos', value: stats.puntosEmitidos, icon: 'M12 2L2 7l10 5 10-5-10-5z' },
    { label: 'Puntos canjeados', value: stats.puntosCanjeados, icon: 'M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6' },
  ] : []

  const quickLinks = [
    { to: '/admin/usuarios', label: 'Ver Usuarios', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
    { to: '/admin/premios', label: 'Gestionar Premios', icon: 'M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6M12 3v12M4 7l8-4 8 4' },
    { to: '/admin/canjes', label: 'Validar Canjes', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2' },
    { to: '/admin/puntos', label: 'Ajustar Puntos', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  ]

  return (
    <AdminLayout title="Reportes">
      {error && <div className="admin-alert show error">{error}</div>}

      <div className="admin-stats">
        {cards.map((c, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon}/></svg>
            </div>
            <span className="stat-label">{c.label}</span>
            <span className="stat-value">{c.value?.toLocaleString() ?? '—'}</span>
          </div>
        ))}
      </div>

      <div className="admin-panel">
        <div className="admin-panel-header"><h2>Accesos rápidos</h2></div>
        <div className="admin-quick-links">
          {quickLinks.map((l, i) => (
            <Link key={i} to={l.to} className="admin-quick-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D6A50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={l.icon}/></svg>
              <span>{l.label}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
