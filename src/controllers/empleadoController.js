const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const checkinController = require('../controllers/checkinController');
const metasController = require('../controllers/metasController');

// Todas estas rutas requieren que el usuario esté autenticado
router.use(verificarToken);

// Rutas de Check-ins
router.post('/checkin', checkinController.crearCheckin);
router.get('/checkins', checkinController.obtenerMisCheckins);

// Rutas de Metas
router.get('/metas', metasController.obtenerMisMetas);
router.put('/metas/:id/progreso', metasController.actualizarProgresoMeta);

module.exports = router;