import { API_BASE } from '../context/AuthContext'

const FB_SDK_ID = 'facebook-jssdk'
const FB_API_VERSION = import.meta.env.VITE_FACEBOOK_API_VERSION || 'v20.0'
const FB_APP_ID = (import.meta.env.VITE_FACEBOOK_APP_ID || '').trim()

function isHttpsPage() {
  return typeof window !== 'undefined' && window.location.protocol === 'https:'
}

function waitForFbReady(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const timer = setInterval(() => {
      if (window.FB && typeof window.FB.init === 'function') {
        clearInterval(timer)
        resolve(window.FB)
        return
      }

      if (Date.now() - start > timeoutMs) {
        clearInterval(timer)
        reject(new Error('Facebook SDK timeout'))
      }
    }, 50)
  })
}

async function ensureFacebookSdk() {
  if (!FB_APP_ID) {
    throw new Error('Falta VITE_FACEBOOK_APP_ID en el frontend.')
  }

  if (!document.getElementById('fb-root')) {
    const root = document.createElement('div')
    root.id = 'fb-root'
    document.body.prepend(root)
  }

  if (window.FB && typeof window.FB.init === 'function') {
    return window.FB
  }

  window.fbAsyncInit = function initFacebookSdk() {
    window.FB.init({
      appId: FB_APP_ID,
      cookie: true,
      xfbml: true,
      version: FB_API_VERSION,
    })

    if (window.FB?.AppEvents?.logPageView) {
      window.FB.AppEvents.logPageView()
    }
  }

  if (!document.getElementById(FB_SDK_ID)) {
    const js = document.createElement('script')
    js.id = FB_SDK_ID
    js.src = 'https://connect.facebook.net/en_US/sdk.js'
    js.async = true
    js.defer = true
    document.body.appendChild(js)
  }

  return waitForFbReady()
}

function getFacebookLoginStatus(FB) {
  return new Promise((resolve) => {
    FB.getLoginStatus((response) => resolve(response))
  })
}

function loginWithFacebook(FB) {
  return new Promise((resolve) => {
    FB.login(
      (response) => resolve(response),
      { scope: 'public_profile,email' }
    )
  })
}

export async function handleFacebookSdkLogin({ setAlert, saveSession, onSuccess, onNewUser }) {
  try {
    // Facebook Login with JS SDK requires HTTPS pages.
    if (!isHttpsPage()) {
      setAlert({ message: 'Facebook requiere HTTPS en web. Redirigiendo al flujo OAuth...', type: 'error' })
      await handleOAuthLogin('facebook', setAlert)
      return
    }

    const FB = await ensureFacebookSdk()

    let response = await getFacebookLoginStatus(FB)
    if (response.status !== 'connected') {
      response = await loginWithFacebook(FB)
    }

    if (response.status !== 'connected' || !response.authResponse?.accessToken) {
      setAlert({ message: 'No se completo el inicio de sesion con Facebook.', type: 'error' })
      return
    }

    const res = await fetch(`${API_BASE}/auth/oauth/facebook/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: response.authResponse.accessToken }),
    })

    const data = await res.json()
    if (!res.ok) {
      setAlert({ message: data.error || 'Error al autenticar con Facebook.', type: 'error' })
      return
    }

    if (typeof onNewUser === 'function' && data?.is_new_user && data?.user?.id) {
      onNewUser(data.user.id)
    }

    if (typeof saveSession === 'function') {
      saveSession(data.token, data.user)
    }

    setAlert({ message: 'Sesion iniciada con Facebook.', type: 'success' })
    if (typeof onSuccess === 'function') {
      onSuccess(data)
    }
  } catch (err) {
    console.error('Facebook SDK login error:', err)
    setAlert({ message: 'No se pudo usar Facebook SDK. Intentando flujo OAuth...', type: 'error' })
    await handleOAuthLogin('facebook', setAlert)
  }
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="22" height="22">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

export function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.03 4.388 11.027 10.125 11.927V15.563H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.932-1.956 1.888v2.264h3.328l-.532 3.49h-2.796v8.437C19.612 23.1 24 18.103 24 12.073z" />
    </svg>
  )
}

export function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
          <stop offset="0%"  stopColor="#ffd600" />
          <stop offset="15%" stopColor="#ff7a00" />
          <stop offset="35%" stopColor="#ff0069" />
          <stop offset="65%" stopColor="#d300c5" />
          <stop offset="100%" stopColor="#7638fa" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" ry="6" fill="url(#ig-grad)" />
      <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="white" />
    </svg>
  )
}

export function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

export async function handleOAuthLogin(provider, setAlert) {
  try {
    const redirectTo = `${window.location.origin}/oauth-callback`
    const url = `${API_BASE}/auth/oauth/${provider}?redirectTo=${encodeURIComponent(redirectTo)}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setAlert({ message: `No se pudo iniciar ${provider} login.`, type: 'error' })
    }
  } catch {
    setAlert({ message: 'Error de conexión.', type: 'error' })
  }
}
