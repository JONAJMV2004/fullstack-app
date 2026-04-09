const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lealtadController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// Estancias
router.post('/estancias', ctrl.registrarEstancia);
router.get('/estancias', ctrl.getEstancias);
router.get('/ubicaciones', ctrl.getUbicaciones);

// Puntos (balance + historial + resumen)
router.get('/puntos', ctrl.getPuntos);

// Carnet (lightweight — solo user + balance para tarjeta)
router.get('/carnet', ctrl.getCarnet);

// Premios
router.get('/premios', ctrl.getPremios);

// Canjes
router.post('/canjes', ctrl.canjearPremio);
router.get('/canjes', ctrl.getCanjes);
router.post('/canjes/validar', ctrl.validarCodigo);

module.exports = router;
