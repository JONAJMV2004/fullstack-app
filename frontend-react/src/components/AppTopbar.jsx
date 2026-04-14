import CielitoLogo from './CielitoLogo'
import SideMenu from './SideMenu'

export default function AppTopbar({ balance, nivel }) {
  return (
    <header className="app-topbar">
      {balance !== undefined ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Icono de puntos */}
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg,#0d2a18,#1a3d26)',
            border: '1.5px solid rgba(201,168,76,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1 }}>
              Puntos
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{
                fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.1,
                background: nivel?.grad || 'linear-gradient(135deg,#A07830,#E8C97A,#C9A84C)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {(balance ?? 0).toLocaleString()}
              </span>
              {nivel && (
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em',
                  background: nivel.grad,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  {nivel.icon}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div />
      )}
      <SideMenu />
    </header>
  )
}

export function AppLogoCircle() {
  return (
    <div className="app-logo-circle">
      <img src="./LOGO_CH.png" alt="Cielito Home" className="app-logo-image" />
    </div>
  )
}
