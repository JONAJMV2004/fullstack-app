import CielitoLogo from './CielitoLogo'
import SideMenu from './SideMenu'

export default function AppTopbar() {
  return (
    <header className="app-topbar">
      <div></div>
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
