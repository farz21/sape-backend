// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const evaluacionController = require('../controllers/evaluacionController');
const verificarToken = require('../middlewares/authMiddleware');

// Listado general
router.get('/empleados', verificarToken, userController.obtenerEmpleados);

// vista individual y las transacciones
router.get('/empleados/:id', verificarToken, evaluacionController.obtenerHistorialEmpleado);
router.post('/evaluaciones', verificarToken, evaluacionController.crearEvaluacion);

module.exports = router;