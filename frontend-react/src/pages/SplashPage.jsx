import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CielitoLogo from '../components/CielitoLogo'

const PWA_LANDING_SEEN_KEY = 'pwa_prompt_seen_landing'

export default function SplashPage() {
  const [pwaPromptEvent, setPwaPromptEvent] = useState(null)
  const [showPwaPrompt, setShowPwaPrompt] = useState(false)
  const [isIosDevice, setIsIosDevice] = useState(false)

  useEffect(() => {
    const alreadySeen = localStorage.getItem(PWA_LANDING_SEEN_KEY) === '1'
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    const userAgent = navigator.userAgent || navigator.vendor || ''
    const isiOS = /iPad|iPhone|iPod/.test(userAgent)

    setIsIosDevice(isiOS)

    if (alreadySeen || isStandalone) {
      if (isStandalone) {
        localStorage.setItem(PWA_LANDING_SEEN_KEY, '1')
      }
      return
    }

    setShowPwaPrompt(true)
    localStorage.setItem(PWA_LANDING_SEEN_KEY, '1')

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setPwaPromptEvent(event)
    }

    const handleAppInstalled = () => {
      setShowPwaPrompt(false)
      setPwaPromptEvent(null)
      localStorage.setItem(PWA_LANDING_SEEN_KEY, '1')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  async function handleInstallPwa() {
    if (!pwaPromptEvent) return

    pwaPromptEvent.prompt()
    await pwaPromptEvent.userChoice
    setPwaPromptEvent(null)
    setShowPwaPrompt(false)
  }

  function handleClosePwaPrompt() {
    setShowPwaPrompt(false)
    localStorage.setItem(PWA_LANDING_SEEN_KEY, '1')
  }

  return (
    <body className="splash-body">
      {showPwaPrompt && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="pwa-modal-title">
          <div className="modal-card pwa-modal-card">
            <div className="pwa-modal-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M12 3v12" />
                <path d="m8 11 4 4 4-4" />
                <rect x="4" y="17" width="16" height="4" rx="1.5" />
              </svg>
            </div>
            <h3 id="pwa-modal-title" className="modal-title">Instala Cielito Home</h3>
            <p className="modal-desc">
              Agrega la app a tu pantalla de inicio para entrar más rápido.
              {isIosDevice && !pwaPromptEvent && ' En Safari, toca Compartir y luego Agregar a pantalla de inicio.'}
            </p>

            <div className="modal-actions pwa-modal-actions">
              <button type="button" className="btn-modal-cancel" onClick={handleClosePwaPrompt}>Ahora no</button>
              {pwaPromptEvent && (
                <button type="button" className="btn-ch-primary modal-confirm-btn" onClick={handleInstallPwa}>Instalar</button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="splash-wrapper">
        <div className="splash-logo">
          <CielitoLogo size={96} strokeColor="#2D6A50" strokeWidth="2" />
          <p className="splash-brand">Cielito Home</p>
          <p className="splash-tagline">EXPERIENCIAS A LA CARTA</p>
        </div>
        <div className="splash-actions">
          <Link to="/login" className="btn-splash-primary">Iniciar Sesión</Link>
          <Link to="/register" className="btn-splash-secondary">Crear Cuenta</Link>
        </div>
      </div>
    </body>
  )
}
