import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, API_BASE } from '../context/AuthContext'

export default function OAuthCallbackPage() {
  const [status, setStatus] = useState('Verificando autenticación…')
  const { saveSession } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const run = async () => {
      const hash = window.location.hash.substring(1)
      const params = Object.fromEntries(new URLSearchParams(hash))
      const { access_token, refresh_token } = params

      if (!access_token) {
        setStatus('Authentication failed. No token received.')
        setTimeout(() => navigate('/'), 2500)
        return
      }

      try {
        const res = await fetch(`${API_BASE}/auth/oauth/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token, refresh_token }),
        })

        const data = await res.json()

        if (!res.ok) {
          setStatus(data.error || 'Authentication failed.')
          setTimeout(() => navigate('/'), 2500)
          return
        }

        saveSession(data.token, data.user)
        setStatus('Success! Redirecting to dashboard…')
        setTimeout(() => navigate('/dashboard'), 500)
      } catch {
        setStatus('Network error. Please try again.')
        setTimeout(() => navigate('/'), 2500)
      }
    }

    run()
  }, [navigate, saveSession])

  return (
    <div className="app-body">
      <div className="app-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p id="status-msg" style={{ fontSize: '1.1rem', color: '#555' }}>{status}</p>
      </div>
    </div>
  )
}
