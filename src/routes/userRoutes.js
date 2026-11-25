const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const notificacionController = require("../controllers/notificacionController");
const evaluacionController = require("../controllers/evaluacionController");
const metasController = require("../controllers/metasController");
const proyectoController = require("../controllers/proyectoController");
const dueloController = require("../controllers/dueloController");
const adminController = require("../controllers/adminController");

const {
  registrarCheckin,
  obtenerCheckins,
  eliminarCheckinAdmin,
} = require("../controllers/checkinController");

const {
  verificarToken,
  evaluarRolAdmin,
} = require("../middlewares/authMiddleware");

// RUTAS DEL ADMINISTRADOR

router.get(
  "/admin/estadisticas",
  verificarToken,
  evaluarRolAdmin,
  adminController.obtenerEstadisticas,
);

router.get(
  "/admin/notificaciones",
  verificarToken,
  evaluarRolAdmin,
  notificacionController.obtenerNotificaciones,
);

router.put(
  "/admin/notificaciones/:id/leida",
  verificarToken,
  evaluarRolAdmin,
  notificacionController.marcarNotificacionLeida,
);

// GESTION DE METAS

router.get(
  "/admin/metas",
  verificarToken,
  evaluarRolAdmin,
  metasController.obtenerMetasAdmin,
);

router.post(
  "/admin/metas",
  verificarToken,
  evaluarRolAdmin,
  metasController.crearMetaAdmin,
);

router.put(
  "/admin/metas/:id",
  verificarToken,
  evaluarRolAdmin,
  metasController.actualizarMetaAdmin,
);

router.delete(
  "/admin/metas/:id",
  verificarToken,
  evaluarRolAdmin,
  metasController.eliminarMetaAdmin,
);

// GESTION DE PROYECTOS

router.get(
  "/admin/proyectos",
  verificarToken,
  evaluarRolAdmin,
  proyectoController.obtenerProyectos,
);

router.post(
  "/admin/proyectos",
  verificarToken,
  evaluarRolAdmin,
  proyectoController.crearProyecto,
);

router.put(
  "/admin/proyectos/:id",
  verificarToken,
  evaluarRolAdmin,
  proyectoController.actualizarProyecto,
);

router.delete(
  "/admin/proyectos/:id",
  verificarToken,
  evaluarRolAdmin,
  proyectoController.eliminarProyecto,
);

// GESTION DE ASIGNACIONES

router.get(
  "/admin/asignaciones",
  verificarToken,
  evaluarRolAdmin,
  proyectoController.obtenerAsignaciones,
);

router.post(
  "/admin/asignaciones",
  verificarToken,
  evaluarRolAdmin,
  proyectoController.crearAsignacion,
);

router.put(
  "/admin/asignaciones/:id",
  verificarToken,
  evaluarRolAdmin,
  proyectoController.actualizarAsignacion,
);

router.delete(
  "/admin/asignaciones/:id",
  verificarToken,
  evaluarRolAdmin,
  proyectoController.eliminarAsignacion,
);

// LISTADO Y DETALLE DE EMPLEADOS

router.get("/empleados", verificarToken, userController.obtenerEmpleados);

router.get(
  "/empleados/:id",
  verificarToken,
  evaluacionController.obtenerHistorialEmpleado,
);

// EVALUACIONES

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

// CRUD DE EMPLEADOS

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

// DUELOS CON IA

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

// CHECK-INS ADMIN

router.delete(
  "/admin/checkins/:id",
  verificarToken,
  evaluarRolAdmin,
  eliminarCheckinAdmin,
);

// RUTAS DEL EMPLEADO

router.get(
  "/empleado/dashboard",
  verificarToken,
  userController.obtenerDashboard,
);

router.get(
  "/empleado/perfil",
  verificarToken,
  userController.obtenerMiPerfil,
);

router.put(
  "/empleado/perfil/avatar",
  verificarToken,
  userController.actualizarAvatar,
);

router.post(
  "/empleado/checkin",
  verificarToken,
  registrarCheckin,
);

router.get(
  "/empleado/checkins",
  verificarToken,
  obtenerCheckins,
);

router.get(
  "/empleado/metas",
  verificarToken,
  metasController.obtenerMisMetas,
);

router.put(
  "/empleado/metas/:id/progreso",
  verificarToken,
  metasController.actualizarProgresoMeta,
);

router.get(
  "/empleado/notificaciones",
  verificarToken,
  notificacionController.obtenerNotificaciones,
);

router.put(
  "/empleado/notificaciones/:id/leida",
  verificarToken,
  notificacionController.marcarNotificacionLeida,
);

router.put(
  "/empleado/notificaciones/leidas",
  verificarToken,
  notificacionController.marcarTodasLeidas,
);

module.exports = router;