import { Link } from 'react-router-dom'
import CielitoLogo from '../components/CielitoLogo'

export default function SplashPage() {
  return (
    <body className="splash-body">
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
