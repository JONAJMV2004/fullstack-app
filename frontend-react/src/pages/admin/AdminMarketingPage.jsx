import { useState, useEffect } from 'react'
import { useAuth, API_BASE } from '../../context/AuthContext'
import AdminLayout from '../../components/AdminLayout'

// Convierte links de Google Drive al formato de imagen directa
function convertirUrlImagen(url) {
  if (!url) return url
  // https://drive.google.com/file/d/FILE_ID/view...
  const matchFile = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (matchFile) return `https://drive.google.com/uc?export=view&id=${matchFile[1]}`
  // https://drive.google.com/open?id=FILE_ID
  const matchOpen = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/)
  if (matchOpen) return `https://drive.google.com/uc?export=view&id=${matchOpen[1]}`
  return url
}

export default function AdminMarketingPage() {
  const { authHeaders } = useAuth()
  const [form, setForm] = useState({ asunto: '', mensaje: '', imagenUrl: '' })
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [totalClientes, setTotalClientes] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [imgError, setImgError] = useState(false)

  // Cargar total de clientes al montar
  useEffect(() => {
    fetch(`${API_BASE}/admin/usuarios`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        const clientes = (d.usuarios || []).filter(u => u.tipo_usuario === 'cliente')
        setTotalClientes(clientes.length)
      })
      .catch(() => {})
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'imagenUrl') {
      setImgError(false)
      setPreviewUrl(convertirUrlImagen(value.trim()))
    }
  }

  async function handleEnviar(e) {
    e.preventDefault()
    setAlert(null)
    if (!form.asunto.trim() || !form.mensaje.trim()) {
      setAlert({ type: 'error', msg: 'El asunto y el mensaje son requeridos.' })
      return
    }
    if (!window.confirm(`¿Enviar esta campaña a ${totalClientes ?? 'todos los'} clientes registrados?`)) return

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/marketing`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          asunto: form.asunto.trim(),
          mensaje: form.mensaje.trim(),
          imagenUrl: previewUrl || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAlert({ type: 'success', msg: data.message })
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    } finally {
      setLoading(false)
    }
  }

  const hoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <AdminLayout title="Marketing">
      {alert && (
        <div className={`admin-alert show ${alert.type}`} style={{ marginBottom: 20 }}>
          {alert.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Editor ── */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2>Nueva Campaña</h2>
            {totalClientes !== null && (
              <span style={{
                background: '#e6f4ee', color: '#2D6A50', borderRadius: 20,
                padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700,
              }}>
                {totalClientes} destinatarios
              </span>
            )}
          </div>

          <form onSubmit={handleEnviar} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div className="admin-form-group">
              <label>Asunto del correo</label>
              <input
                className="admin-input"
                name="asunto"
                value={form.asunto}
                onChange={handleChange}
                placeholder="Ej: ¡Oferta especial solo este fin de semana!"
                maxLength={120}
                required
              />
            </div>

            <div className="admin-form-group">
              <label>URL de imagen <span style={{ color: '#a0aec0', fontWeight: 400 }}>(opcional)</span></label>
              <input
                className="admin-input"
                name="imagenUrl"
                value={form.imagenUrl}
                onChange={handleChange}
                placeholder="https://..."
                type="text"
              />
              {previewUrl && !imgError && (
                <img
                  key={previewUrl}
                  src={previewUrl}
                  alt="preview"
                  onError={() => setImgError(true)}
                  style={{
                    width: '100%', maxHeight: 180, objectFit: 'cover',
                    borderRadius: 10, marginTop: 8, border: '1px solid #e2e8f0',
                  }}
                />
              )}
              {imgError && (
                <p style={{ fontSize: '0.78rem', color: '#e53e3e', marginTop: 6 }}>
                  No se pudo cargar la imagen. Verifica la URL.
                </p>
              )}
            </div>

            <div className="admin-form-group">
              <label>Mensaje</label>
              <textarea
                className="admin-input"
                name="mensaje"
                value={form.mensaje}
                onChange={handleChange}
                placeholder="Escribe aquí el contenido de tu correo..."
                rows={8}
                maxLength={2000}
                style={{ resize: 'vertical', lineHeight: 1.6 }}
                required
              />
              <span style={{ fontSize: '0.75rem', color: '#a0aec0', textAlign: 'right', display: 'block' }}>
                {form.mensaje.length} / 2000
              </span>
            </div>

            <button
              type="submit"
              className="btn-admin primary"
              disabled={loading || !form.asunto.trim() || !form.mensaje.trim()}
              style={{ padding: '12px 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Enviando correos...
                </>
              ) : (
                <>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Enviar a {totalClientes !== null ? `${totalClientes} clientes` : 'todos los clientes'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Vista previa ── */}
        <div className="admin-panel" style={{ position: 'sticky', top: 20 }}>
          <div className="admin-panel-header">
            <h2>Vista Previa del Correo</h2>
            <span style={{ fontSize: '0.78rem', color: '#718096' }}>{hoy}</span>
          </div>

          <div style={{
            border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden',
            fontFamily: 'Arial, sans-serif', fontSize: '0.88rem',
          }}>
            {/* Header */}
            <div style={{ background: '#2D6A50', padding: '20px 28px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem', letterSpacing: 0.5 }}>Cielito Home</div>
              <div style={{ color: '#a7d9c0', fontSize: '0.78rem', marginTop: 3 }}>Programa de Lealtad</div>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 28px', background: '#fff' }}>
              {/* Imagen */}
              {previewUrl && !imgError && (
                <img
                  key={previewUrl}
                  src={previewUrl}
                  alt="promo"
                  onError={() => setImgError(true)}
                  style={{ width: '100%', borderRadius: 8, marginBottom: 16, display: 'block' }}
                />
              )}

              {/* Asunto */}
              <h2 style={{
                fontSize: '1.05rem', fontWeight: 700, color: '#2d3748',
                margin: '0 0 12px', minHeight: 24,
              }}>
                {form.asunto || <span style={{ color: '#cbd5e0' }}>Asunto del correo...</span>}
              </h2>

              {/* Mensaje */}
              <div style={{
                color: '#4a5568', lineHeight: 1.7, whiteSpace: 'pre-line',
                minHeight: 60,
              }}>
                {form.mensaje || <span style={{ color: '#cbd5e0' }}>El contenido del mensaje aparecerá aquí...</span>}
              </div>

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: '#a0aec0', margin: 0 }}>
                  Eres parte del programa de lealtad de Cielito Home.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{ background: '#f7fafc', padding: '14px 28px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#a0aec0' }}>
                © {new Date().getFullYear()} Cielito Home · Programa de Lealtad
              </p>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
