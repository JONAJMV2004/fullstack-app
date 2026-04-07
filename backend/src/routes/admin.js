const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/auth');
const adminCtrl = require('../controllers/adminController');

// Middleware: solo admins
function requireAdmin(req, res, next) {
  if (req.user?.tipo_usuario !== 'admin')
    return res.status(403).json({ error: 'Acceso restringido a administradores.' });
  next();
}

router.use(verifyToken, requireAdmin);

// Usuarios
router.get('/usuarios',        adminCtrl.getUsuarios);
router.delete('/usuarios/:id', adminCtrl.deleteUsuario);

// Puntos
router.get('/puntos',    adminCtrl.getPuntos);
router.post('/puntos',   adminCtrl.ajustarPuntos);

// Estancias
router.get('/estancias',        adminCtrl.getEstancias);
router.patch('/estancias/:id',  adminCtrl.updateEstancia);

// Premios
router.get('/premios',        adminCtrl.getPremios);
router.post('/premios',       adminCtrl.createPremio);
router.patch('/premios/:id',  adminCtrl.updatePremio);
router.delete('/premios/:id', adminCtrl.deletePremio);

// Canjes
router.get('/canjes',          adminCtrl.getCanjes);
router.post('/canjes/validar', adminCtrl.validarCanje);

// Reportes
router.get('/reportes', adminCtrl.getReportes);

// Ubicaciones
router.get('/ubicaciones',        adminCtrl.getUbicaciones);
router.post('/ubicaciones',       adminCtrl.createUbicacion);
router.patch('/ubicaciones/:id',  adminCtrl.updateUbicacion);
router.delete('/ubicaciones/:id', adminCtrl.deleteUbicacion);;

module.exports = router;
