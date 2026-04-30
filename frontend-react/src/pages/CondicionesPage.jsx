import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AppTopbar from '../components/AppTopbar'
import BottomNav from '../components/BottomNav'

const SECTIONS = [
  {
    id: 'aceptacion',
    title: '1. Aceptación de los Términos',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M20 6L9 17l-5-5" /></svg>,
    content: (
      <p>Al registrarte o utilizar la App, aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna de las disposiciones, deberás abstenerte de utilizar la aplicación y podrás solicitar la eliminación de tu cuenta.</p>
    ),
  },
  {
    id: 'registro',
    title: '2. Registro de la Cuenta',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    content: (
      <p>Para participar en el programa de recompensas deberás registrarte proporcionando información verídica y completa. Es tu responsabilidad mantener la confidencialidad de tus credenciales de acceso y no compartir tu cuenta con terceros. Cualquier actividad realizada desde tu cuenta será de tu entera responsabilidad.</p>
    ),
  },
  {
    id: 'programa',
    title: '3. Funcionamiento del Programa',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <p><strong>Acumulación de Puntos:</strong> Los usuarios acumulan puntos por cada compra realizada o por completar acciones dentro de la App (p.ej., invitar amigos, completar encuestas).</p>
        <p><strong>Canje de Recompensas:</strong> Los puntos pueden canjearse por productos, descuentos o beneficios dentro de la App. Los puntos tienen un valor variable según las políticas del programa y no tienen valor monetario ni son transferibles.</p>
        <p><strong>Vigencia de los Puntos:</strong> Los puntos tendrán una vigencia limitada que será notificada a los usuarios dentro de la App. Los puntos vencidos no podrán recuperarse.</p>
        <p><strong>Exclusiones:</strong> Algunos productos o servicios podrán estar excluidos del programa de recompensas. Los detalles estarán disponibles en la sección Recompensas de la App.</p>
      </div>
    ),
  },
  {
    id: 'uso-adecuado',
    title: '4. Uso Adecuado de la App',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
    content: (
      <>
        <p style={{ marginBottom: '0.5rem' }}>El usuario se compromete a:</p>
        <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>No utilizar la App para fines ilegales o fraudulentos.</li>
          <li>No realizar actividades que puedan afectar el funcionamiento de la App (p.ej., ataques informáticos, intentos de manipular el sistema de puntos).</li>
          <li>No suplantar la identidad de otros usuarios ni crear cuentas falsas o duplicadas.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'cancelacion',
    title: '5. Cancelación o Suspensión',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
    content: (
      <>
        <p style={{ marginBottom: '0.5rem' }}>Cielito Home podrá suspender o cancelar la cuenta del usuario en caso de:</p>
        <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Uso indebido de la App o violación de estos Términos y Condiciones.</li>
          <li>Actividades fraudulentas, sospechosas o que atenten contra la integridad del programa.</li>
          <li>Solicitud expresa del propio usuario.</li>
        </ul>
        <p style={{ marginTop: '0.6rem' }}>La cancelación de cuenta implica la pérdida de puntos y recompensas acumulados no utilizados, lo cual será previamente informado al usuario.</p>
      </>
    ),
  },
  {
    id: 'propiedad-intelectual',
    title: '6. Propiedad Intelectual',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    content: (
      <p>La App, su contenido, diseño, logotipos y todos los materiales relacionados están protegidos por derechos de autor y otras leyes de propiedad intelectual de Cielito Home. Los usuarios no podrán copiar, distribuir, modificar, reproducir ni crear obras derivadas sin el consentimiento expreso y por escrito de la Empresa.</p>
    ),
  },
  {
    id: 'responsabilidad',
    title: '7. Limitación de Responsabilidad',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    content: (
      <>
        <p style={{ marginBottom: '0.5rem' }}>Cielito Home no será responsable por:</p>
        <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Errores técnicos, interrupciones o fallas en el servicio de la App.</li>
          <li>Pérdida de puntos o recompensas debido a fallas en la App o en el sistema.</li>
          <li>La precisión de la información proporcionada por terceros.</li>
          <li>Daños indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso de la App.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'modificaciones',
    title: '8. Modificaciones de los Términos',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
    content: (
      <p>Cielito Home se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios serán notificados dentro de la App y se entenderán aceptados si el usuario continúa utilizando el servicio después de la fecha de vigencia de las modificaciones.</p>
    ),
  },
  {
    id: 'legislacion',
    title: '9. Legislación Aplicable',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M3 6h18M3 12h18M3 18h18" /><path d="M8 6v12M16 6v12" /></svg>,
    content: (
      <p>Estos Términos y Condiciones se rigen por las leyes de México. Cualquier disputa relacionada con los mismos será resuelta por los tribunales competentes de Aguascalientes, Aguascalientes, renunciando expresamente a cualquier otro fuero que pudiera corresponderles.</p>
    ),
  },
  {
    id: 'consentimiento',
    title: '10. Consentimiento del Usuario',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M20 6L9 17l-5-5" /></svg>,
    content: (
      <p>Al usar la App, el usuario acepta los términos establecidos en estos Términos y Condiciones, así como en la Política de Privacidad de Cielito Home. Este consentimiento es expreso y se renueva en cada sesión de uso del servicio.</p>
    ),
  },
]

export default function CondicionesPage() {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="app-body">
      <div className="app-page">
        <AppTopbar />

        <div className="inner-page-content">
          <button className="settings-back-btn" onClick={() => navigate('/ajustes')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><polyline points="15 18 9 12 15 6" /></svg>
            Ajustes
          </button>

          <div className="settings-page-header">
            <div className="settings-page-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            </div>
            <h1 className="settings-page-title">Términos y Condiciones</h1>
            <p className="settings-page-desc">Última actualización: Abril 2026</p>
          </div>

          {/* Privacy Policy shortcut */}
          <Link
            to="/privacy-policy"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'linear-gradient(145deg, #0f2a1a, #162e1e)',
              border: '1px solid rgba(201,168,76,0.24)',
              borderRadius: 14,
              padding: '12px 16px',
              marginBottom: '1rem',
              textDecoration: 'none',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" width="20" height="20" style={{ flexShrink: 0 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Política de Privacidad</p>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.48)', marginTop: 1 }}>
                Consulta cómo recopilamos y protegemos tus datos personales
              </p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" width="16" height="16">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          <div className="accordion-list">
            {SECTIONS.map(section => (
              <div key={section.id} className={`accordion-item ${expanded === section.id ? 'accordion-item--open' : ''}`}>
                <button
                  className="accordion-header"
                  onClick={() => setExpanded(expanded === section.id ? null : section.id)}
                >
                  <div className="accordion-header-left">
                    <div className="accordion-icon">{section.icon}</div>
                    <span className="accordion-title">{section.title}</span>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"
                    className={`accordion-chevron ${expanded === section.id ? 'accordion-chevron--open' : ''}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {expanded === section.id && (
                  <div className="accordion-body" style={{ fontSize: '0.84rem', color: '#4a5568', lineHeight: 1.65 }}>
                    {section.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
