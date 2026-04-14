const crypto = require('crypto');
const EstanciaModel = require('../models/estanciaModel');
const PuntosModel = require('../models/puntosModel');
const PremioModel = require('../models/premioModel');
const CanjeModel = require('../models/canjeModel');
const CodigoModel = require('../models/codigoModel');
const { enviarCorreoEstanciaAprobada, enviarCorreoCanjeAprobado } = require('../config/mailer');

// ── ESTANCIAS ────────────────────────────────────────────────────────────────

// POST /api/lealtad/estancias
exports.registrarEstancia = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { fecha_check_in, fecha_check_out, ubicacion } = req.body;

    if (!fecha_check_in || !fecha_check_out || !String(ubicacion || '').trim())
      return res.status(400).json({ error: 'check_in, check_out y ubicacion son requeridos.' });

    const ubicacionNormalizada = String(ubicacion).trim();
    const ubicacionExiste = await EstanciaModel.existeUbicacion(ubicacionNormalizada);
    if (!ubicacionExiste)
      return res.status(400).json({ error: 'La ubicación seleccionada no es válida.' });

    if (new Date(fecha_check_out) <= new Date(fecha_check_in))
      return res.status(400).json({ error: 'La fecha de check-out debe ser posterior al check-in.' });

    const conflictos = await EstanciaModel.checkConflicto({
      ubicacion: ubicacionNormalizada,
      fechaCheckIn: fecha_check_in,
      fechaCheckOut: fecha_check_out,
    });

    if (conflictos.length > 0)
      return res.status(409).json({ error: 'La ubicación ya está ocupada en esas fechas. Por favor elige otras fechas.' });

    const estancia = await EstanciaModel.create({
      usuarioId,
      fechaCheckIn: fecha_check_in,
      fechaCheckOut: fecha_check_out,
      puntosGanados: 0,
      estado: 'pendiente',
      ubicacion: ubicacionNormalizada,
    });

    return res.status(201).json({ message: 'Estancia registrada. Pendiente de aprobación.', estancia });
  } catch (err) {
    console.error('registrarEstancia error:', err.message);
    return res.status(500).json({ error: 'Error al registrar estancia.' });
  }
};

// GET /api/lealtad/ubicaciones
exports.getUbicaciones = async (req, res) => {
  try {
    const ubicaciones = await EstanciaModel.getUbicacionesDisponibles();
    return res.status(200).json({ ubicaciones });
  } catch (err) {
    console.error('getUbicaciones error:', err.message);
    return res.status(500).json({ error: 'Error al obtener ubicaciones.' });
  }
};

// GET /api/lealtad/estancias
exports.getEstancias = async (req, res) => {
  try {
    const estancias = await EstanciaModel.getByUsuario(req.user.id);
    return res.status(200).json({ estancias });
  } catch (err) {
    console.error('getEstancias error:', err.message);
    return res.status(500).json({ error: 'Error al obtener estancias.' });
  }
};

// ── PUNTOS ───────────────────────────────────────────────────────────────────

// GET /api/lealtad/puntos
exports.getPuntos = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const [balance, historial, canjes, totalCodigos] = await Promise.all([
      PuntosModel.getBalance(usuarioId),
      PuntosModel.getHistory(usuarioId),
      CanjeModel.getByUsuario(usuarioId),
      CodigoModel.countCanjeadosByUsuario(usuarioId),
    ]);

    return res.status(200).json({
      balance,
      historial,
      canjes,
      resumen: {
        total_codigos: totalCodigos,
        total_canjes: canjes.length,
      },
    });
  } catch (err) {
    console.error('getPuntos error:', err.message);
    return res.status(500).json({ error: err.message || 'Error al obtener puntos.' });
  }
};

// GET /api/lealtad/carnet  (lightweight endpoint para tarjeta — solo user + balance)
exports.getCarnet = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const UsuarioModel = require('../models/usuarioModel');

    // Fetch user + balance en paralelo (sin historial completo)
    const [usuario, balance] = await Promise.all([
      UsuarioModel.findById(usuarioId),
      PuntosModel.getBalance(usuarioId),
    ]);

    if (!usuario)
      return res.status(404).json({ error: 'Usuario no encontrado.' });

    // Agregar Cache-Control para reducir tráfico (5 minutos)
    res.set('Cache-Control', 'private, max-age=300');

    return res.status(200).json({
      user: { ...usuario, name: usuario.nombre },
      balance,
    });
  } catch (err) {
    console.error('getCarnet error:', err.message);
    return res.status(500).json({ error: 'Error al obtener carnet.' });
  }
};

// ── PREMIOS ──────────────────────────────────────────────────────────────────

// GET /api/lealtad/premios
exports.getPremios = async (req, res) => {
  try {
    const premios = await PremioModel.getAll();
    // Premios cambian poco — cachear 5 min
    res.set('Cache-Control', 'public, max-age=300');
    return res.status(200).json({ premios });
  } catch (err) {
    console.error('getPremios error:', err.message);
    return res.status(500).json({ error: 'Error al obtener premios.' });
  }
};

// ── CANJES ───────────────────────────────────────────────────────────────────

// POST /api/lealtad/canjes
exports.canjearPremio = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { premio_id, ubicacion } = req.body;

    if (!premio_id)
      return res.status(400).json({ error: 'premio_id es requerido.' });

    const premio = await PremioModel.getById(premio_id);
    if (!premio)
      return res.status(404).json({ error: 'Premio no encontrado.' });

    if (premio.disponibilidad <= 0)
      return res.status(409).json({ error: 'Premio sin disponibilidad.' });

    const balance = await PuntosModel.getBalance(usuarioId);
    if (balance < premio.puntos_necesarios)
      return res.status(422).json({
        error: `Puntos insuficientes. Necesitas ${premio.puntos_necesarios}, tienes ${balance}.`,
      });

    // Generar código único
    const codigoUnico = crypto.randomBytes(6).toString('hex').toUpperCase();

    // Operaciones secuenciales con rollback de best-effort para mantener consistencia
    await PremioModel.decrementDisponibilidad(premio_id);

    let canje;
    try {
      canje = await CanjeModel.create({
        usuarioId,
        premioId: premio_id,
        puntosUtilizados: premio.puntos_necesarios,
        codigoUnico,
        ubicacion: ubicacion ? String(ubicacion).trim() : null,
      });
    } catch (canjeErr) {
      // Revertir disponibilidad si el canje no se pudo registrar
      await PremioModel.incrementDisponibilidad(premio_id).catch(() => {});
      throw canjeErr;
    }

    try {
      await PuntosModel.addEntry({
        usuarioId,
        descripcion: `Canje: ${premio.nombre}`,
        puntos: -premio.puntos_necesarios,
      });
    } catch (puntosErr) {
      // Revertir disponibilidad y eliminar el canje si el descuento falló
      await PremioModel.incrementDisponibilidad(premio_id).catch(() => {});
      await CanjeModel.deleteById(canje.id).catch(() => {});
      throw puntosErr;
    }

    return res.status(201).json({
      message: 'Canje realizado con éxito.',
      canje,
      codigo: codigoUnico,
    });
  } catch (err) {
    console.error('canjearPremio error:', err.message);
    return res.status(500).json({ error: 'Error al realizar canje.' });
  }
};

// GET /api/lealtad/canjes
exports.getCanjes = async (req, res) => {
  try {
    const canjes = await CanjeModel.getByUsuario(req.user.id);
    return res.status(200).json({ canjes });
  } catch (err) {
    console.error('getCanjes error:', err.message);
    return res.status(500).json({ error: 'Error al obtener canjes.' });
  }
};

// ── CODIGOS ──────────────────────────────────────────────────────────────────

// POST /api/lealtad/codigos/canjear
exports.canjearCodigo = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { codigo } = req.body;

    if (!codigo || !String(codigo).trim())
      return res.status(400).json({ error: 'El código es requerido.' });

    const registro = await CodigoModel.getByCodigo(String(codigo).trim());

    if (!registro)
      return res.status(404).json({ error: 'Código no encontrado. Verifica que esté escrito correctamente.' });

    if (registro.estatus === 'canjeado')
      return res.status(409).json({ error: 'Este código ya fue canjeado anteriormente.' });

    const actualizado = await CodigoModel.canjear(registro.id, usuarioId);

    await PuntosModel.addEntry({
      usuarioId,
      descripcion: `Estancia en ${registro.ubicacion} (${registro.noches} noche${registro.noches !== 1 ? 's' : ''})`,
      puntos: registro.puntos,
    });

    // Enviar correo de confirmación (sin bloquear la respuesta)
    if (req.user.email) {
      const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
      enviarCorreoEstanciaAprobada({
        email: req.user.email,
        nombre: req.user.nombre || req.user.name || 'Cliente',
        checkIn: fmt(registro.fecha_ingreso),
        checkOut: fmt(registro.fecha_salida),
        noches: registro.noches,
        puntos: registro.puntos,
      }).catch(err => console.error('Error enviando correo de código canjeado:', err.message))
    }

    return res.status(200).json({
      message: `¡Código canjeado! Se te asignaron ${registro.puntos} puntos.`,
      codigo: actualizado,
      puntos: registro.puntos,
    });
  } catch (err) {
    console.error('canjearCodigo error:', err.message);
    return res.status(500).json({ error: 'Error al canjear el código.' });
  }
};

// GET /api/lealtad/codigos
exports.getCodigosUsuario = async (req, res) => {
  try {
    const codigos = await CodigoModel.getByUsuario(req.user.id);
    return res.status(200).json({ codigos });
  } catch (err) {
    console.error('getCodigosUsuario error:', err.message);
    return res.status(500).json({ error: 'Error al obtener códigos.' });
  }
};

// PATCH /api/lealtad/codigos/:id/resena
exports.guardarResena = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { id } = req.params;
    const { calificacion, comentario } = req.body;

    if (!calificacion || calificacion < 1 || calificacion > 5)
      return res.status(400).json({ error: 'La calificación debe ser entre 1 y 5.' });

    const actualizado = await CodigoModel.guardarResena(id, usuarioId, { calificacion, comentario });
    if (!actualizado)
      return res.status(404).json({ error: 'Estadía no encontrada.' });

    return res.status(200).json({ message: 'Reseña guardada.', codigo: actualizado });
  } catch (err) {
    console.error('guardarResena error:', err.message);
    return res.status(500).json({ error: 'Error al guardar la reseña.' });
  }
};

// POST /api/lealtad/canjes/validar
exports.validarCodigo = async (req, res) => {
  try {
    const { codigo } = req.body;

    if (!codigo)
      return res.status(400).json({ error: 'El código es requerido.' });

    const canje = await CanjeModel.getByCodigoUnico(codigo.toUpperCase());
    if (!canje)
      return res.status(404).json({ error: 'Código no encontrado.' });

    if (canje.estado === 'aprobado')
      return res.status(409).json({ error: 'Este código ya fue utilizado.' });

    if (canje.estado === 'rechazado')
      return res.status(409).json({ error: 'Este código fue rechazado.' });

    // Verificar expiración (30 días desde la fecha del canje)
    const expiracion = new Date(canje.fecha);
    expiracion.setDate(expiracion.getDate() + 30);
    if (new Date() > expiracion)
      return res.status(410).json({ error: 'Este código ha expirado.' });

    // Marcar como aprobado
    const canjeActualizado = await CanjeModel.updateEstado(canje.id, 'aprobado');

    // Enviar correo de confirmación al cliente
    if (canje.usuarios?.email) {
      enviarCorreoCanjeAprobado({
        email: canje.usuarios.email,
        nombre: canje.usuarios.nombre || 'Cliente',
        premio: canje.premios?.nombre || 'Premio',
        codigoUnico: canje.codigo_unico,
      }).catch(err => console.error('Error enviando correo de canje aprobado:', err.message))
    }

    return res.status(200).json({
      message: 'Código válido. Canje aprobado.',
      canje: canjeActualizado,
      usuario: canje.usuarios,
      premio: canje.premios,
    });
  } catch (err) {
    console.error('validarCodigo error:', err.message);
    return res.status(500).json({ error: 'Error al validar código.' });
  }
};
