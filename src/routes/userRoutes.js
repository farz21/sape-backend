const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const evaluacionController = require("../controllers/evaluacionController");
const checkinController = require("../controllers/checkinController"); 
const metasController = require("../controllers/metasController"); 
const dueloController = require('../controllers/dueloController');
const { verificarToken, evaluarRolAdmin } = require('../middlewares/authMiddleware');

// ==========================================
// RUTAS DEL ADMINISTRADOR
// ==========================================

// Estadísticas del Dashboard Admin
router.get('/admin/estadisticas', verificarToken, evaluarRolAdmin, userController.obtenerEstadisticas);

// Listado general de empleados y perfiles
router.get("/empleados", verificarToken, userController.obtenerEmpleados);
router.get('/empleados/:id', verificarToken, evaluacionController.obtenerHistorialEmpleado);

// Gestión de Evaluaciones
router.post('/evaluaciones', verificarToken, evaluarRolAdmin, evaluacionController.crearEvaluacion);
router.delete('/evaluaciones/:id', verificarToken, evaluarRolAdmin, evaluacionController.eliminarEvaluacion);

// CRUD de Empleados
router.post('/empleados', verificarToken, evaluarRolAdmin, userController.crearEmpleado);
router.put('/empleados/:id', verificarToken, evaluarRolAdmin, userController.actualizarEmpleado);
router.delete('/empleados/:id', verificarToken, evaluarRolAdmin, userController.eliminarEmpleado);

// Duelos y Análisis Estratégico por IA 
router.post('/admin/duelos/comparar', verificarToken, evaluarRolAdmin, dueloController.compararEmpleados);
router.get('/admin/duelos/historial', verificarToken, evaluarRolAdmin, dueloController.obtenerHistorialDuelos);


// ==========================================
// RUTAS DEL EMPLEADO
// ==========================================

// Vistas base
router.get('/empleado/dashboard', verificarToken, userController.obtenerDashboard);
router.get('/empleado/perfil', verificarToken, userController.obtenerMiPerfil);

// Check-ins de estado de ánimo y progreso
router.post('/empleado/checkin', verificarToken, checkinController.crearCheckin);
router.get('/empleado/checkins', verificarToken, checkinController.obtenerMisCheckins);

// Metas y KPIs
router.get('/empleado/metas', verificarToken, metasController.obtenerMisMetas);
router.put('/empleado/metas/:id/progreso', verificarToken, metasController.actualizarProgresoMeta);


module.exports = router;