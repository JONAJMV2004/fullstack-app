import { Link } from 'react-router-dom'
import CielitoLogo from '../components/CielitoLogo'

const S = { width: '100%', background: 'var(--bg)', borderRadius: 'var(--radius-card)', padding: '16px 18px' }
const H = { margin: '0 0 8px', fontSize: '0.95rem', color: 'var(--green-dark)', fontWeight: 600 }
const P = { margin: 0, fontSize: '0.85rem', color: '#718096', lineHeight: 1.65 }
const A = { color: 'var(--green)' }

export default function DataDeletionPage() {
  return (
    <div className="auth-body">
      <div className="auth-page" style={{ paddingBottom: 48 }}>

        <Link to="/login" className="ch-back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>

        <div className="auth-logo-circle">
          <CielitoLogo size={64} strokeColor="#2D6A50" strokeWidth="2" />
        </div>

        <h2 className="auth-title">Eliminación de Datos</h2>
        <p className="ch-subtitle" style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          Cielito Home · Última actualización: Abril 2026
        </p>

        <div className="ch-form">
          <div style={S}>
            <h3 style={H}>Cómo solicitar la eliminación</h3>
            <p style={{ ...P, marginBottom: 8 }}>
              Puedes solicitar la eliminación total de tus datos personales por cualquiera de estos medios:
            </p>
            <ol style={{ ...P, paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 4 }}>Desde la app: <strong>Ajustes → Eliminar cuenta.</strong></li>
              <li style={{ marginBottom: 4 }}>
                Por correo:{' '}
                <a href="mailto:sistemas@cielitohome.com" style={A}>sistemas@cielitohome.com</a>
              </li>
              <li>
                Por WhatsApp:{' '}
                <a href="https://wa.me/524497556167" style={A}>+52 449 755 6167</a>,{' '}
                indicando el correo de tu cuenta.
              </li>
            </ol>
          </div>

          <div style={S}>
            <h3 style={H}>Plazo de atención</h3>
            <p style={P}>
              Validamos identidad y procesamos la eliminación en un plazo máximo de 10 días hábiles.
              Al finalizar, te enviaremos confirmación al correo registrado.
            </p>
          </div>

          <div style={S}>
            <h3 style={H}>Alcance de la eliminación</h3>
            <p style={P}>
              Eliminamos datos de perfil, historial de puntos y registros vinculados a tu cuenta, salvo
              información que debamos conservar por obligaciones legales, fiscales o de seguridad.
            </p>
          </div>

          <div style={S}>
            <h3 style={H}>Política de privacidad</h3>
            <p style={P}>
              Consulta nuestra{' '}
              <Link to="/privacy-policy" style={{ ...A, fontWeight: 600 }}>Política de Privacidad</Link>{' '}
              para más información sobre el tratamiento de tus datos.
            </p>
          </div>
        </div>

        <Link to="/login" className="ch-link-center" style={{ marginTop: '1.5rem' }}>
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  )
}
