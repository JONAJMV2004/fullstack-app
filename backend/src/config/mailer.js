const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function plantillaBase(contenido) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #2D6A50; padding: 24px 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 1.4rem; letter-spacing: .5px;">Cielito Home</h1>
        <p style="color: #a7d9c0; margin: 4px 0 0; font-size: .85rem;">Programa de Lealtad</p>
      </div>
      <div style="padding: 28px 32px; background: #fff;">
        ${contenido}
      </div>
      <div style="background: #f7fafc; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: .78rem; color: #a0aec0;">
          © ${new Date().getFullYear()} Cielito Home · Programa de Lealtad
        </p>
      </div>
    </div>
  `;
}

async function enviarCorreoEstanciaAprobada({ email, nombre, checkIn, checkOut, noches, puntos }) {
  const html = plantillaBase(`
    <p style="font-size: 1rem; color: #2d3748; margin: 0 0 8px;">Hola, <strong>${nombre}</strong> 👋</p>
    <p style="color: #4a5568; margin: 0 0 20px;">¡Buenas noticias! Tu estadía en <strong>Cielito Home</strong> ha sido confirmada y los puntos ya están en tu cuenta.</p>

    <div style="background: #f0fff4; border: 1.5px solid #c6f6d5; border-radius: 10px; padding: 18px 20px; margin-bottom: 20px;">
      <p style="margin: 0 0 10px; font-size: .85rem; font-weight: 700; color: #276749; text-transform: uppercase; letter-spacing: .05em;">Resumen de tu estadía</p>
      <table style="width: 100%; border-collapse: collapse; font-size: .9rem; color: #2d3748;">
        <tr>
          <td style="padding: 5px 0; color: #718096;">Check-in</td>
          <td style="padding: 5px 0; font-weight: 600; text-align: right;">${checkIn}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #718096;">Check-out</td>
          <td style="padding: 5px 0; font-weight: 600; text-align: right;">${checkOut}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #718096;">Noches</td>
          <td style="padding: 5px 0; font-weight: 600; text-align: right;">${noches}</td>
        </tr>
        <tr style="border-top: 1px solid #c6f6d5;">
          <td style="padding: 8px 0 0; color: #2D6A50; font-weight: 700;">Puntos ganados</td>
          <td style="padding: 8px 0 0; font-weight: 800; color: #2D6A50; text-align: right; font-size: 1.1rem;">+${puntos} pts</td>
        </tr>
      </table>
    </div>

    <p style="color: #718096; font-size: .85rem; margin: 0;">Ingresa a la app para ver tu saldo actualizado y canjear tus puntos por premios.</p>
  `);

  await transporter.sendMail({
    from: `"Cielito Home" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: '✅ Tu estadía en Cielito Home fue confirmada',
    html,
  });
}

async function enviarCorreoCanjeAprobado({ email, nombre, premio, codigoUnico }) {
  const html = plantillaBase(`
    <p style="font-size: 1rem; color: #2d3748; margin: 0 0 8px;">Hola, <strong>${nombre}</strong> 👋</p>
    <p style="color: #4a5568; margin: 0 0 20px;">¡Tu solicitud de canje fue <strong>aprobada</strong>! Aquí está tu código para recoger tu regalo en recepción.</p>

    <div style="background: #fffff0; border: 1.5px solid #fefcbf; border-radius: 10px; padding: 18px 20px; margin-bottom: 20px;">
      <p style="margin: 0 0 10px; font-size: .85rem; font-weight: 700; color: #744210; text-transform: uppercase; letter-spacing: .05em;">Tu regalo</p>
      <p style="margin: 0 0 16px; font-size: 1rem; font-weight: 700; color: #2d3748;">${premio}</p>
      <p style="margin: 0 0 8px; font-size: .8rem; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: .05em;">Código de canje</p>
      <div style="background: #2D6A50; color: #fff; border-radius: 8px; padding: 12px 0; text-align: center; letter-spacing: 4px; font-size: 1.5rem; font-weight: 800; font-family: monospace;">
        ${codigoUnico}
      </div>
    </div>

    <p style="color: #718096; font-size: .85rem; margin: 0 0 6px;">Presenta este código en recepción para recibir tu premio. Válido por <strong>30 días</strong>.</p>
    <p style="color: #a0aec0; font-size: .8rem; margin: 0;">Si tienes dudas, contáctanos en recepción o por WhatsApp.</p>
  `);

  await transporter.sendMail({
    from: `"Cielito Home" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: '🎁 Tu canje en Cielito Home fue aprobado',
    html,
  });
}

async function enviarCorreoMarketing({ emails, asunto, mensaje, imagenUrl }) {
  const bloqueImagen = imagenUrl
    ? `<img src="${imagenUrl}" alt="Promoción Cielito Home" style="width:100%;max-width:560px;display:block;border-radius:8px;margin-bottom:20px;" />`
    : '';

  const html = plantillaBase(`
    ${bloqueImagen}
    <h2 style="font-size:1.15rem;font-weight:700;color:#2d3748;margin:0 0 14px;">${asunto}</h2>
    <div style="font-size:.92rem;color:#4a5568;line-height:1.7;white-space:pre-line;">${mensaje}</div>
    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="font-size:.8rem;color:#a0aec0;margin:0;">Eres parte del programa de lealtad de Cielito Home.<br>Para dejar de recibir correos, contáctanos en recepción.</p>
    </div>
  `);

  const resultados = { enviados: 0, fallidos: 0 };

  for (const email of emails) {
    try {
      await transporter.sendMail({
        from: `"Cielito Home" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: asunto,
        html,
      });
      resultados.enviados++;
    } catch (err) {
      console.error(`Error enviando a ${email}:`, err.message);
      resultados.fallidos++;
    }
    // Pausa entre envíos para no superar límites de Gmail
    await new Promise(r => setTimeout(r, 150));
  }

  return resultados;
}

async function enviarCorreoNuevoCanje({ nombreCliente, emailCliente, premio, puntos, codigoUnico, ubicacion }) {
  const html = plantillaBase(`
    <p style="font-size: 1rem; color: #2d3748; margin: 0 0 8px;">Nueva solicitud de canje recibida.</p>

    <div style="background: #f7fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin-bottom: 20px;">
      <p style="margin: 0 0 10px; font-size: .85rem; font-weight: 700; color: #2D6A50; text-transform: uppercase; letter-spacing: .05em;">Detalle del canje</p>
      <table style="width: 100%; border-collapse: collapse; font-size: .9rem; color: #2d3748;">
        <tr>
          <td style="padding: 5px 0; color: #718096;">Cliente</td>
          <td style="padding: 5px 0; font-weight: 600; text-align: right;">${nombreCliente}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #718096;">Correo</td>
          <td style="padding: 5px 0; font-weight: 600; text-align: right;">${emailCliente}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #718096;">Premio solicitado</td>
          <td style="padding: 5px 0; font-weight: 600; text-align: right;">${premio}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #718096;">Puntos utilizados</td>
          <td style="padding: 5px 0; font-weight: 600; text-align: right;">${puntos} pts</td>
        </tr>
        ${ubicacion ? `<tr>
          <td style="padding: 5px 0; color: #718096;">Ubicación</td>
          <td style="padding: 5px 0; font-weight: 600; text-align: right;">${ubicacion}</td>
        </tr>` : ''}
        <tr style="border-top: 1px solid #e2e8f0;">
          <td style="padding: 8px 0 0; color: #718096;">Código de canje</td>
          <td style="padding: 8px 0 0; font-weight: 800; color: #2D6A50; text-align: right; font-family: monospace; font-size: 1rem; letter-spacing: 2px;">${codigoUnico}</td>
        </tr>
      </table>
    </div>

    <p style="color: #718096; font-size: .85rem; margin: 0;">Ingresa al panel de administración para aprobar o rechazar este canje.</p>
  `);

  await transporter.sendMail({
    from: `"Cielito Home" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: `🎁 Nuevo canje: ${premio} — ${nombreCliente}`,
    html,
  });
}

async function enviarCorreoCanjeEntregado({ email, nombre, premio }) {
  const html = plantillaBase(`
    <p style="font-size: 1rem; color: #2d3748; margin: 0 0 8px;">Hola, <strong>${nombre}</strong> 👋</p>
    <p style="color: #4a5568; margin: 0 0 20px;">¡Tu premio ya fue entregado! Esperamos que lo disfrutes mucho.</p>

    <div style="background: #e9d8fd; border: 1.5px solid #d6bcfa; border-radius: 10px; padding: 18px 20px; margin-bottom: 20px; text-align: center;">
      <p style="margin: 0 0 6px; font-size: .8rem; font-weight: 700; color: #44337a; text-transform: uppercase; letter-spacing: .05em;">Premio entregado</p>
      <p style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #44337a;">${premio}</p>
    </div>

    <p style="color: #718096; font-size: .85rem; margin: 0;">Gracias por ser parte del programa de lealtad de Cielito Home. ¡Nos vemos pronto! 🏡</p>
  `);

  await transporter.sendMail({
    from: `"Cielito Home" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: '🎉 Tu premio de Cielito Home fue entregado',
    html,
  });
}

module.exports = { enviarCorreoEstanciaAprobada, enviarCorreoCanjeAprobado, enviarCorreoMarketing, enviarCorreoNuevoCanje, enviarCorreoCanjeEntregado };
