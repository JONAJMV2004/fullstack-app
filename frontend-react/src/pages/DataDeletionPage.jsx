import { Link } from 'react-router-dom'

export default function DataDeletionPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb', color: '#1f2937' }}>
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '40px 20px 64px' }}>
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#124734' }}>Eliminacion de Datos de Usuario</h1>
          <p style={{ marginTop: 8, color: '#4b5563' }}>Cielito Home - Ultima actualizacion: Abril 2026</p>
        </header>

        <section style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>Como solicitar la eliminacion de datos</h2>
          <p>
            Puedes solicitar la eliminacion total de tus datos personales de Cielito Home por cualquiera de estos medios:
          </p>
          <ol>
            <li>Desde la app: Ajustes {'>'} Eliminar cuenta.</li>
            <li>Por correo: enviar solicitud a <a href="mailto:soporte@cielitohome.com">soporte@cielitohome.com</a>.</li>
            <li>Por WhatsApp: +52 449 755 6167, indicando el correo de tu cuenta.</li>
          </ol>
        </section>

        <section style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>Plazo de atencion</h2>
          <p>
            Validamos identidad y procesamos la eliminacion en un plazo maximo de 10 dias habiles.
            Al finalizar, te enviaremos confirmacion al correo registrado.
          </p>
        </section>

        <section style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>Alcance de la eliminacion</h2>
          <p>
            Eliminamos datos de perfil, historial de puntos y registros vinculados a tu cuenta, salvo informacion
            que debamos conservar por obligaciones legales, fiscales o de seguridad.
          </p>
        </section>

        <section style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
          <h2 style={{ marginTop: 0 }}>Enlaces relacionados</h2>
          <p>
            Politica de privacidad: <Link to="/privacy-policy">/privacy-policy</Link>
          </p>
          <p style={{ marginBottom: 0 }}>
            Volver a <Link to="/">inicio</Link>.
          </p>
        </section>
      </main>
    </div>
  )
}