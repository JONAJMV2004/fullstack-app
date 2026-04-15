const NotificacionModel = require('../models/notificacionModel');
const { emitToUser } = require('../config/socket');

/**
 * Crea una notificación, la persiste y la envía por WebSocket.
 * @param {object} opts
 * @param {string} opts.usuarioId
 * @param {string} opts.tipo - puntos|canje|estancia|promo|sistema|general
 * @param {string} opts.titulo
 * @param {string} [opts.mensaje]
 * @returns {Promise<object>} la notificación creada
 */
async function enviarNotificacion({ usuarioId, tipo, titulo, mensaje }) {
  const notif = await NotificacionModel.create({ usuarioId, tipo, titulo, mensaje });
  emitToUser(usuarioId, notif);
  return notif;
}

/**
 * Crea notificaciones para múltiples usuarios.
 */
async function enviarNotificacionMasiva(usuarios, { tipo, titulo, mensaje }) {
  const rows = usuarios.map(u => ({
    usuarioId: typeof u === 'string' ? u : u.id,
    tipo,
    titulo,
    mensaje,
  }));
  const notifs = await NotificacionModel.createMany(rows);
  notifs.forEach(n => emitToUser(n.usuario_id, n));
  return notifs;
}

module.exports = { enviarNotificacion, enviarNotificacionMasiva };
