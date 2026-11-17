const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const notificacionController = require("../controllers/notificacionController");
const evaluacionController = require("../controllers/evaluacionController");
//const checkinController = require("../controllers/checkinController");
const {
  registrarCheckin,
  obtenerCheckins,
} = require("../controllers/checkinController");

const metasController = require("../controllers/metasController");
const dueloController = require("../controllers/dueloController");
const {
  verificarToken,
  evaluarRolAdmin,
} = require("../middlewares/authMiddleware");

// ==========================================
// RUTAS DEL ADMINISTRADOR
// ==========================================

// Estadísticas del Dashboard Admin
router.get(
  "/admin/estadisticas",
  verificarToken,
  evaluarRolAdmin,
  userController.obtenerEstadisticas,
);

// Listado general de empleados y perfiles
router.get("/empleados", verificarToken, userController.obtenerEmpleados);
router.get(
  "/empleados/:id",
  verificarToken,
  evaluacionController.obtenerHistorialEmpleado,
);

// Gestión de Evaluaciones
router.post(
  "/evaluaciones",
  verificarToken,
  evaluarRolAdmin,
  evaluacionController.crearEvaluacion,
);
router.delete(
  "/evaluaciones/:id",
  verificarToken,
  evaluarRolAdmin,
  evaluacionController.eliminarEvaluacion,
);

// CRUD de Empleados
router.post(
  "/empleados",
  verificarToken,
  evaluarRolAdmin,
  userController.crearEmpleado,
);
router.put(
  "/empleados/:id",
  verificarToken,
  evaluarRolAdmin,
  userController.actualizarEmpleado,
);
router.delete(
  "/empleados/:id",
  verificarToken,
  evaluarRolAdmin,
  userController.eliminarEmpleado,
);
router.put(
  "/empleado/cambiar-password",
  verificarToken,
  userController.cambiarPassword,
);
// Duelos y Análisis Estratégico por IA
router.post(
  "/admin/duelos/comparar",
  verificarToken,
  evaluarRolAdmin,
  dueloController.compararEmpleados,
);
router.get(
  "/admin/duelos/historial",
  verificarToken,
  evaluarRolAdmin,
  dueloController.obtenerHistorialDuelos,
);

// ==========================================
// RUTAS DEL EMPLEADO
// ==========================================

// Vistas base
router.get(
  "/empleado/dashboard",
  verificarToken,
  userController.obtenerDashboard,
);
router.get("/empleado/perfil", verificarToken, userController.obtenerMiPerfil);

// Check-ins de estado de ánimo y progreso
/*
router.post('/empleado/checkin', verificarToken, checkinController.crearCheckin);
router.get('/empleado/checkins', verificarToken, checkinController.obtenerMisCheckins);
*/

router.post("/empleado/checkin", verificarToken, registrarCheckin);

router.get("/empleado/checkins", verificarToken, obtenerCheckins);

// Metas y KPIs
router.get("/empleado/metas", verificarToken, metasController.obtenerMisMetas);
router.put(
  "/empleado/metas/:id/progreso",
  verificarToken,
  metasController.actualizarProgresoMeta,
);
// NOTIFICACIONES DEL EMPLEADO
router.get(
  "/empleado/notificaciones",
  verificarToken,
  notificacionController.obtenerNotificaciones
);

router.put(
  "/empleado/notificaciones/:id/leida",
  verificarToken,
  notificacionController.marcarNotificacionLeida
);

router.put(
  "/empleado/notificaciones/leidas",
  verificarToken,
  notificacionController.marcarTodasLeidas
);

module.exports = router;
