import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, API_BASE } from '../context/AuthContext'

const PWA_NEW_USER_KEY = 'pwa_prompt_new_user'

export default function OAuthCallbackPage() {
  const [status, setStatus] = useState('Verificando autenticación…')
  const { saveSession } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const run = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const queryParams = new URLSearchParams(window.location.search)
      const access_token = hashParams.get('access_token') || queryParams.get('access_token')
      const refresh_token = hashParams.get('refresh_token') || queryParams.get('refresh_token')

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

        if (data?.is_new_user && data?.user?.id) {
          localStorage.setItem(PWA_NEW_USER_KEY, String(data.user.id))
        }

        saveSession(data.token, data.user)
        setStatus('Success! Redirecting to home…')
        setTimeout(() => navigate('/home'), 500)
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
