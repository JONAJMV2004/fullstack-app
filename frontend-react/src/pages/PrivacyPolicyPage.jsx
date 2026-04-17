import { Link } from 'react-router-dom'

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb', color: '#1f2937' }}>
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '40px 20px 64px' }}>
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#124734' }}>Politica de Privacidad</h1>
          <p style={{ marginTop: 8, color: '#4b5563' }}>Cielito Home - Ultima actualizacion: Abril 2026</p>
        </header>

        <section style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>1. Datos que recopilamos</h2>
          <p>
            Recopilamos datos basicos para operar el programa de lealtad: nombre, correo electronico,
            telefono, historial de estancias y movimientos de puntos.
          </p>
        </section>

        <section style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>2. Uso de la informacion</h2>
          <p>
            Utilizamos la informacion para autenticar usuarios, administrar el programa de recompensas,
            enviar notificaciones relacionadas al servicio y mejorar la experiencia dentro de la aplicacion.
          </p>
        </section>

        <section style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>3. Comparticion de datos</h2>
          <p>
            No vendemos ni compartimos datos personales con terceros para fines comerciales. Solo compartimos
            informacion cuando es necesaria para operar servicios autorizados por el usuario o cumplir obligaciones legales.
          </p>
        </section>

        <section style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>4. Seguridad</h2>
          <p>
            Protegemos la informacion con controles tecnicos y organizativos razonables, incluyendo conexiones seguras
            y acceso restringido a datos sensibles.
          </p>
        </section>

        <section style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>5. Derechos del usuario</h2>
          <p>
            Puedes solicitar acceso, correccion o eliminacion de tu informacion personal escribiendo a{' '}
            <a href="mailto:soporte@cielitohome.com">soporte@cielitohome.com</a>.
          </p>
          <p>
            Tambien puedes consultar las instrucciones de eliminacion de datos en{' '}
            <Link to="/data-deletion">/data-deletion</Link>.
          </p>
        </section>

        <section style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
          <h2 style={{ marginTop: 0 }}>6. Contacto</h2>
          <p>
            Para dudas sobre privacidad o tratamiento de datos, contactanos en{' '}
            <a href="mailto:soporte@cielitohome.com">soporte@cielitohome.com</a>.
          </p>
          <p style={{ marginBottom: 0 }}>
            Volver a <Link to="/">inicio</Link>.
          </p>
        </section>
      </main>
    </div>
  )
}