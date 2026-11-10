const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const evaluacionController = require("../controllers/evaluacionController");
const verificarToken = require("../middlewares/authMiddleware");

// Listado general
router.get("/empleados", verificarToken, userController.obtenerEmpleados);

// RUTAS DEL ADMINISTRADOR
router.get('/empleados', verificarToken, userController.obtenerEmpleados);
router.get('/empleados/:id', verificarToken, evaluacionController.obtenerHistorialEmpleado);
router.post('/evaluaciones', verificarToken, evaluacionController.crearEvaluacion);

// RUTAS DEL EMPLEADO (Nuevas)
router.get('/empleado/dashboard', verificarToken, userController.obtenerDashboard);
router.get('/empleado/perfil', verificarToken, userController.obtenerMiPerfil);

module.exports = router;
