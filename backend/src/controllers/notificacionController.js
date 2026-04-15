const NotificacionModel = require('../models/notificacionModel');

// GET /api/notificaciones
exports.getNotificaciones = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    const { notificaciones, total } = await NotificacionModel.getByUsuario(req.user.id, { limit, offset });
    return res.json({ notificaciones, total });
  } catch (err) {
    console.error('getNotificaciones error:', err.message);
    return res.status(500).json({ error: 'Error al obtener notificaciones.' });
  }
};

// GET /api/notificaciones/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await NotificacionModel.countUnread(req.user.id);
    return res.json({ count });
  } catch (err) {
    console.error('getUnreadCount error:', err.message);
    return res.status(500).json({ error: 'Error al obtener conteo.' });
  }
};

// PATCH /api/notificaciones/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notif = await NotificacionModel.markAsRead(req.params.id, req.user.id);
    return res.json({ notificacion: notif });
  } catch (err) {
    console.error('markAsRead error:', err.message);
    return res.status(500).json({ error: 'Error al marcar como leída.' });
  }
};

// PATCH /api/notificaciones/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await NotificacionModel.markAllAsRead(req.user.id);
    return res.json({ message: 'Todas las notificaciones marcadas como leídas.' });
  } catch (err) {
    console.error('markAllAsRead error:', err.message);
    return res.status(500).json({ error: 'Error al marcar todas como leídas.' });
  }
};

// DELETE /api/notificaciones/:id
exports.deleteNotificacion = async (req, res) => {
  try {
    await NotificacionModel.deleteById(req.params.id, req.user.id);
    return res.json({ message: 'Notificación eliminada.' });
  } catch (err) {
    console.error('deleteNotificacion error:', err.message);
    return res.status(500).json({ error: 'Error al eliminar notificación.' });
  }
};
