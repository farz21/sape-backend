const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const evaluacionController = require("../controllers/evaluacionController");
const verificarToken = require("../middlewares/authMiddleware");

// Estadísticas del Dashboard Admin
router.get('/admin/estadisticas', verificarToken, userController.obtenerEstadisticas);

// Listado general
router.get("/empleados", verificarToken, userController.obtenerEmpleados);

// RUTAS DEL ADMINISTRADOR
router.get('/empleados', verificarToken, userController.obtenerEmpleados);
router.get('/empleados/:id', verificarToken, evaluacionController.obtenerHistorialEmpleado);
router.post('/evaluaciones', verificarToken, evaluacionController.crearEvaluacion);


// Rutas para CRUD de empleados
router.post('/empleados', verificarToken, userController.crearEmpleado);
router.put('/empleados/:id', verificarToken, userController.actualizarEmpleado);
router.delete('/empleados/:id', verificarToken, userController.eliminarEmpleado);
module.exports = router;

// RUTAS DEL EMPLEADO
router.get('/empleado/dashboard', verificarToken, userController.obtenerDashboard);
router.get('/empleado/perfil', verificarToken, userController.obtenerMiPerfil);

module.exports = router;

