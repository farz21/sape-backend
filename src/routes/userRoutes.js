const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const notificacionController = require("../controllers/notificacionController");
const evaluacionController = require("../controllers/evaluacionController");
const metasController = require("../controllers/metasController");
const proyectoController = require("../controllers/proyectoController");
const dueloController = require("../controllers/dueloController");
const adminController = require("../controllers/adminController");
const puestoController = require("../controllers/puestoController");
const proyectoEmpleadoController = require("../controllers/proyectoEmpleadoController");

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

// GESTION DE DEPARTAMENTOS

router.get(
  "/departamentos",
  verificarToken,
  puestoController.obtenerDepartamentos,
);

router.post(
  "/departamentos",
  verificarToken,
  evaluarRolAdmin,
  puestoController.crearDepartamento,
);

router.put(
  "/departamentos/:id",
  verificarToken,
  evaluarRolAdmin,
  puestoController.actualizarDepartamento,
);

router.delete(
  "/departamentos/:id",
  verificarToken,
  evaluarRolAdmin,
  puestoController.eliminarDepartamento,
);

// GESTION DE PUESTOS

router.get(
  "/puestos",
  verificarToken,
  puestoController.obtenerPuestos,
);

router.post(
  "/puestos",
  verificarToken,
  evaluarRolAdmin,
  puestoController.crearPuesto,
);

router.put(
  "/puestos/:id",
  verificarToken,
  evaluarRolAdmin,
  puestoController.actualizarPuesto,
);

router.delete(
  "/puestos/:id",
  verificarToken,
  evaluarRolAdmin,
  puestoController.eliminarPuesto,
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

// CRUD DE EMPLEADOS

router.get(
  "/empleados",
  verificarToken,
  userController.obtenerEmpleados,
);

router.post(
  "/empleados",
  verificarToken,
  evaluarRolAdmin,
  userController.crearEmpleado,
);

router.get(
  "/empleados/:id",
  verificarToken,
  evaluacionController.obtenerHistorialEmpleado,
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

router.get(
  "/admin/duelos/:id",
  verificarToken,
  evaluarRolAdmin,
  dueloController.obtenerDueloPorId,
);

router.delete(
  "/admin/duelos/:id",
  verificarToken,
  evaluarRolAdmin,
  dueloController.eliminarDuelo,
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

router.put(
  "/empleado/cambiar-password",
  verificarToken,
  userController.cambiarPassword,
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

router.get(
  "/empleado/proyectos",
  verificarToken,
  proyectoEmpleadoController.obtenerMisProyectos,
);

module.exports = router;