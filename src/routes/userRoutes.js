// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const evaluacionController = require('../controllers/evaluacionController');
const verificarToken = require('../middlewares/authMiddleware');

// Estadísticas del Dashboard Admin
router.get('/admin/estadisticas', verificarToken, userController.obtenerEstadisticas);

// Listado general
router.get('/empleados', verificarToken, userController.obtenerEmpleados);

// vista individual y las transacciones
router.get('/empleados/:id', verificarToken, evaluacionController.obtenerHistorialEmpleado);
router.post('/evaluaciones', verificarToken, evaluacionController.crearEvaluacion);

// Rutas para CRUD de empleados
router.post('/empleados', verificarToken, userController.crearEmpleado);
router.put('/empleados/:id', verificarToken, userController.actualizarEmpleado);
router.delete('/empleados/:id', verificarToken, userController.eliminarEmpleado);
module.exports = router;