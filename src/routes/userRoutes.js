const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const evaluacionController = require("../controllers/evaluacionController");
// Importamos los nuevos controladores
const checkinController = require("../controllers/checkinController"); 
const metasController = require("../controllers/metasController"); 
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


// ==========================================
// RUTAS DEL EMPLEADO
// ==========================================

// Vistas base
router.get('/empleado/dashboard', verificarToken, userController.obtenerDashboard);
router.get('/empleado/perfil', verificarToken, userController.obtenerMiPerfil);

// Nuevas rutas: Check-ins de estado de ánimo y progreso
router.post('/empleado/checkin', verificarToken, checkinController.crearCheckin);
router.get('/empleado/checkins', verificarToken, checkinController.obtenerMisCheckins);

// Nuevas rutas: Metas y KPIs
router.get('/empleado/metas', verificarToken, metasController.obtenerMisMetas);
router.put('/empleado/metas/:id/progreso', verificarToken, metasController.actualizarProgresoMeta);


// ÚNICO module.exports SIEMPRE al final del archivo
module.exports = router;