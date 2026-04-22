import { Link } from 'react-router-dom'
import CielitoLogo from '../components/CielitoLogo'

const S = { width: '100%', background: 'var(--bg)', borderRadius: 'var(--radius-card)', padding: '16px 18px' }
const H = { margin: '0 0 8px', fontSize: '0.95rem', color: 'var(--green-dark)', fontWeight: 600 }
const P = { margin: 0, fontSize: '0.85rem', color: '#718096', lineHeight: 1.65 }
const A = { color: 'var(--green)' }

export default function PrivacyPolicyPage() {
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

        <h2 className="auth-title">Política de Privacidad</h2>
        <p className="ch-subtitle" style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          Cielito Home · Última actualización: Abril 2026
        </p>

        <div className="ch-form">
          <div style={S}>
            <h3 style={H}>1. Datos que recopilamos</h3>
            <p style={P}>
              Recopilamos datos básicos para operar el programa de lealtad: nombre, correo electrónico,
              teléfono, historial de estancias y movimientos de puntos.
            </p>
          </div>

          <div style={S}>
            <h3 style={H}>2. Uso de la información</h3>
            <p style={P}>
              Utilizamos la información para autenticar usuarios, administrar el programa de recompensas,
              enviar notificaciones relacionadas al servicio y mejorar la experiencia dentro de la aplicación.
            </p>
          </div>

          <div style={S}>
            <h3 style={H}>3. Compartición de datos</h3>
            <p style={P}>
              No vendemos ni compartimos datos personales con terceros para fines comerciales. Solo compartimos
              información cuando es necesaria para operar servicios autorizados por el usuario o cumplir obligaciones legales.
            </p>
          </div>

          <div style={S}>
            <h3 style={H}>4. Seguridad</h3>
            <p style={P}>
              Protegemos la información con controles técnicos y organizativos razonables, incluyendo conexiones
              seguras y acceso restringido a datos sensibles.
            </p>
          </div>

          <div style={S}>
            <h3 style={H}>5. Derechos del usuario</h3>
            <p style={P}>
              Puedes solicitar acceso, corrección o eliminación de tu información personal escribiendo a{' '}
              <a href="mailto:sistemas@cielitohome.com" style={A}>sistemas@cielitohome.com</a>.{' '}
              Consulta también las instrucciones en{' '}
              <Link to="/data-deletion" style={{ ...A, fontWeight: 600 }}>Eliminación de mis datos</Link>.
            </p>
          </div>

          <div style={S}>
            <h3 style={H}>6. Contacto</h3>
            <p style={P}>
              Para dudas sobre privacidad o tratamiento de datos, contáctanos en{' '}
              <a href="mailto:sistemas@cielitohome.com" style={A}>sistemas@cielitohome.com</a>.
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
