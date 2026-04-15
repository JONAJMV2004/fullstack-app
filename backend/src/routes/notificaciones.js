const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/notificacionController');

router.use(verifyToken);

router.get('/', ctrl.getNotificaciones);
router.get('/unread-count', ctrl.getUnreadCount);
router.patch('/read-all', ctrl.markAllAsRead);
router.patch('/:id/read', ctrl.markAsRead);
router.delete('/:id', ctrl.deleteNotificacion);

module.exports = router;
