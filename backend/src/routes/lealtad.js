const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lealtadController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// Estancias
router.post('/estancias', ctrl.registrarEstancia);
router.get('/estancias', ctrl.getEstancias);

// Puntos (balance + historial + resumen)
router.get('/puntos', ctrl.getPuntos);

// Premios
router.get('/premios', ctrl.getPremios);

// Canjes
router.post('/canjes', ctrl.canjearPremio);
router.get('/canjes', ctrl.getCanjes);
router.post('/canjes/validar', ctrl.validarCodigo);

module.exports = router;
