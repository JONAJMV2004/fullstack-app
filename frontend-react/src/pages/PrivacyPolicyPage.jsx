import { useState } from 'react'
import { Link } from 'react-router-dom'
import CielitoLogo from '../components/CielitoLogo'

const SECTIONS = [
  {
    id: 'responsable',
    title: '1. Identidad del Responsable',
    content: (
      <p>
        <strong>Cielito Home</strong> (en adelante, "la Empresa"), con domicilio en Sierra de la
        Canela, número 244, fraccionamiento Bosques del Prado Norte, Aguascalientes, AGS., es
        responsable del tratamiento de los datos personales que se obtienen a través de la aplicación
        móvil/web de recompensas por lealtad (la "App").
      </p>
    ),
  },
  {
    id: 'datos-recopilados',
    title: '2. Datos Personales Recopilados',
    content: (
      <>
        <p style={{ marginBottom: '0.75rem' }}>La Empresa podrá recopilar los siguientes tipos de datos:</p>
        <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <li><strong>Identificación personal:</strong> nombre, correo electrónico, número de teléfono, fecha de nacimiento, dirección de domicilio.</li>
          <li><strong>Comportamiento de uso:</strong> historial de compras, puntos acumulados, historial de redención, preferencias de usuario.</li>
          <li><strong>Datos técnicos:</strong> dirección IP, identificadores de dispositivo (cookies y UUID), datos de localización, sistema operativo, tipo de navegador.</li>
          <li><strong>Datos opcionales:</strong> intereses relacionados con promociones, participación en encuestas y comentarios en la app.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'finalidades',
    title: '3. Finalidades del Tratamiento',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div>
          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>3.1 Gestión de cuenta y programa de recompensas</p>
          <p>Registro, autenticación y validación de identidad; asignación, acumulación y control de puntos; procesamiento de canjes; administración del historial de actividades; gestión de incidencias y prevención de fraudes.</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>3.2 Comunicaciones personalizadas y marketing</p>
          <p>Notificaciones de cuenta y movimientos de puntos; promociones, campañas y ofertas especiales; actualizaciones de la aplicación; encuestas de satisfacción. Canales: correo, notificaciones push, SMS u otros autorizados.</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>3.3 Mejora de experiencia y analítica</p>
          <p>Análisis de comportamiento y patrones de consumo; optimización del diseño y funcionalidades; desarrollo de nuevos productos y dinámicas dentro del programa. Puede realizarse con datos agregados o anonimizados.</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>3.4 Cumplimiento de obligaciones legales</p>
          <p>Cumplimiento de disposiciones fiscales y contables; atención a autoridades judiciales o administrativas; prevención de fraude y actividades ilícitas.</p>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(201,168,76,0.22)',
          borderRadius: 10,
          padding: '10px 14px'
        }}>
          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Clasificación de finalidades</p>
          <p><strong>Primarias (necesarias):</strong> gestión de la cuenta, operación del programa y cumplimiento legal.</p>
          <p style={{ marginTop: '0.3rem' }}><strong>Secundarias (no necesarias):</strong> marketing personalizado y análisis de comportamiento. Puedes oponerte en cualquier momento.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'transferencia',
    title: '4. Transferencia de Datos',
    content: (
      <>
        <p style={{ marginBottom: '0.75rem' }}>La Empresa podrá compartir tus datos con:</p>
        <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <li><strong>Proveedores de servicios:</strong> hosting, nube, analítica y atención al cliente, sujetos a acuerdos de confidencialidad.</li>
          <li><strong>Socios comerciales:</strong> alianzas del programa de recompensas para ofertas personalizadas.</li>
          <li><strong>Autoridades competentes:</strong> cuando sea requerido por ley, regulación fiscal o solicitud legal válida.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'arco',
    title: '5. Derechos ARCO',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>5.1 Acceso</p>
          <p>Conocer qué datos han sido recopilados, su origen, finalidades y con quién se han compartido. Disponible directamente en tu perfil de la App o por solicitud formal.</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>5.2 Rectificación</p>
          <p>Corregir datos incorrectos, inexactos o desactualizados. Puedes editarlos en tu perfil o contactar soporte para datos no editables directamente.</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>5.3 Cancelación</p>
          <p>Solicitar eliminación de tus datos, lo que implica bloqueo y eliminación de la cuenta y pérdida de puntos acumulados. Algunos datos se conservarán por obligaciones legales.</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>5.4 Oposición</p>
          <p>Oponerte al uso de tus datos para finalidades secundarias como marketing o perfilamiento. No aplica para tratamientos necesarios para cumplir obligaciones contractuales o legales.</p>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(201,168,76,0.22)',
          borderRadius: 10,
          padding: '10px 14px'
        }}>
          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Cómo ejercer tus derechos · Plazos</p>
          <p>
            Envía tu solicitud a{' '}
            <a href="mailto:sistemas@cielitohome.com" style={{ color: 'var(--green)', fontWeight: 600 }}>
              sistemas@cielitohome.com
            </a>{' '}
            con tu nombre, medio de contacto y descripción del derecho a ejercer.
          </p>
          <ul style={{ paddingLeft: '1.1rem', marginTop: '0.5rem' }}>
            <li>Confirmación de recepción: 5 días hábiles</li>
            <li>Respuesta definitiva: máximo 20 días hábiles</li>
            <li>Ejecución: 15 días hábiles tras la respuesta</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'seguridad',
    title: '6. Seguridad de la Información',
    content: (
      <p>
        La Empresa implementa medidas de seguridad físicas, electrónicas y administrativas para
        proteger tus datos personales contra acceso no autorizado, pérdida, uso indebido o alteración.
        Todos los datos se transmiten mediante conexiones cifradas (SSL/TLS) y se almacenan en
        servidores protegidos con acceso restringido a personal autorizado.
      </p>
    ),
  },
  {
    id: 'conservacion',
    title: '7. Conservación de Datos',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <p><strong>Usuarios activos:</strong> datos conservados mientras la cuenta esté activa para operar el programa.</p>
        <p><strong>Usuarios inactivos:</strong> datos conservados 12–24 meses adicionales para permitir reactivación; transcurrido ese plazo, la cuenta puede desactivarse o anonimizarse.</p>
        <p><strong>Cancelación de cuenta:</strong> tus datos serán bloqueados y eliminados. Los puntos y beneficios acumulados se pierden. Ciertos datos se conservan por obligaciones fiscales o legales.</p>
        <p><strong>Eliminación y anonimización:</strong> una vez cumplidas las finalidades y plazos legales, los datos son eliminados de forma segura o anonimizados para uso estadístico sin comprometer tu privacidad.</p>
      </div>
    ),
  },
  {
    id: 'cookies',
    title: '8. Uso de Cookies',
    content: (
      <p>
        La App utiliza cookies y tecnologías similares para mejorar la funcionalidad y experiencia del
        usuario. Puedes configurar tu navegador para bloquear las cookies, aunque esto podría afectar
        algunas funcionalidades de la App.
      </p>
    ),
  },
  {
    id: 'cambios',
    title: '9. Cambios en la Política',
    content: (
      <p>
        Nos reservamos el derecho de modificar esta política en cualquier momento. Cualquier cambio
        será notificado dentro de la App, y los usuarios tendrán la oportunidad de revisar y aceptar
        las nuevas condiciones antes de continuar usando el servicio.
      </p>
    ),
  },
  {
    id: 'consentimiento',
    title: '10. Consentimiento',
    content: (
      <p>
        Al utilizar la App, das tu consentimiento expreso para la recopilación, almacenamiento y uso
        de tus datos personales según lo descrito en esta política. Si no estás de acuerdo, puedes
        ejercer tus derechos ARCO o solicitar la cancelación de tu cuenta en cualquier momento.
      </p>
    ),
  },
]

export default function PrivacyPolicyPage() {
  const [expanded, setExpanded] = useState(null)

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

        {/* Banner ARCO */}
        <div style={{
          background: 'linear-gradient(145deg, #0f2a1a, #162e1e)',
          border: '1px solid rgba(201,168,76,0.24)',
          borderRadius: 14,
          padding: '12px 16px',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" width="20" height="20"
            style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.55 }}>
            Tus datos están protegidos. Puedes solicitar acceso, corrección o eliminación escribiendo a{' '}
            <a href="mailto:sistemas@cielitohome.com" style={{ color: '#C9A84C', fontWeight: 600 }}>
              sistemas@cielitohome.com
            </a>{' '}o desde{' '}
            <Link to="/data-deletion" style={{ color: '#C9A84C', fontWeight: 600 }}>
              Eliminación de mis datos
            </Link>.
          </p>
        </div>

        <div className="accordion-list"
          style={{ borderRadius: 16, overflow: 'hidden' }}>
          {SECTIONS.map(section => (
            <div
              key={section.id}
              className={`accordion-item ${expanded === section.id ? 'accordion-item--open' : ''}`}
            >
              <button
                className="accordion-header"
                onClick={() => setExpanded(expanded === section.id ? null : section.id)}
              >
                <div className="accordion-header-left">
                  <span className="accordion-title">{section.title}</span>
                </div>
                <svg
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  width="18" height="18"
                  className={`accordion-chevron ${expanded === section.id ? 'accordion-chevron--open' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {expanded === section.id && (
                <div className="accordion-body"
                  style={{ fontSize: '0.84rem', color: '#4a5568', lineHeight: 1.65 }}>
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>

        <Link to="/login" className="ch-link-center" style={{ marginTop: '1.5rem' }}>
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  )
}
