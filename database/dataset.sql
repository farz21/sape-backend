-- ==========================================
-- S.A.P.E. - Script completo de Base de Datos
-- ==========================================

CREATE DATABASE IF NOT EXISTS `sape_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE `sape_db`;
-- ------------------------------------------
-- 1. CREACIÓN DE TABLAS (en orden de FK)
-- ------------------------------------------

CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `empresa` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL COMMENT 'Bcrypt hash',
  `rol` varchar(50) DEFAULT 'empleado',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `avatar_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `departamentos` (
  `id_departamento` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `presupuesto` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`id_departamento`),
  UNIQUE KEY `uq_departamentos_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `puestos` (
  `id_puesto` int NOT NULL AUTO_INCREMENT,
  `id_departamento` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `seniority` varchar(50) NOT NULL DEFAULT 'Junior',
  PRIMARY KEY (`id_puesto`),
  UNIQUE KEY `uq_puestos_depto_nombre_seniority` (`id_departamento`, `nombre`, `seniority`),
  KEY `id_departamento` (`id_departamento`),
  CONSTRAINT `puestos_ibfk_1` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `competencias` (
  `id_competencia` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `tipo_skill` varchar(50) NOT NULL,
  PRIMARY KEY (`id_competencia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `proyectos` (
  `id_proyecto` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  PRIMARY KEY (`id_proyecto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `empleados` (
  `id_empleado` int NOT NULL AUTO_INCREMENT,
  `id_puesto` int NOT NULL,
  `legajo` varchar(50) NOT NULL,
  `fecha_ingreso` date NOT NULL,
  `en_periodo_prueba` tinyint(1) NOT NULL DEFAULT '0',
  `id_usuario` int DEFAULT NULL,
  PRIMARY KEY (`id_empleado`),
  UNIQUE KEY `legajo` (`legajo`),
  UNIQUE KEY `uq_empleados_id_usuario` (`id_usuario`),
  KEY `id_puesto` (`id_puesto`),
  CONSTRAINT `empleados_ibfk_1` FOREIGN KEY (`id_puesto`) REFERENCES `puestos` (`id_puesto`) ON DELETE RESTRICT,
  CONSTRAINT `fk_empleado_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `asignaciones` (
  `id_asignacion` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `id_proyecto` int NOT NULL,
  `horas_asignadas` int DEFAULT NULL,
  `rol_en_proyecto` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_asignacion`),
  KEY `id_empleado` (`id_empleado`),
  KEY `id_proyecto` (`id_proyecto`),
  CONSTRAINT `asignaciones_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE,
  CONSTRAINT `asignaciones_ibfk_2` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `checkins_empleado` (
  `id_checkin` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `fecha` date NOT NULL,
  `nivel_motivacion` int NOT NULL COMMENT 'Escala del 1 al 5',
  `carga_trabajo` int NOT NULL COMMENT 'Escala del 1 al 5',
  `logros_semana` text,
  `obstaculos` text,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `link_evidencia` varchar(500) NOT NULL,
  PRIMARY KEY (`id_checkin`),
  KEY `idx_checkins_empleado` (`id_empleado`),
  CONSTRAINT `checkins_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE,
  CONSTRAINT `validar_carga_trabajo` CHECK (((`carga_trabajo` between 1 and 5) and (`carga_trabajo` = floor(`carga_trabajo`)))),
  CONSTRAINT `validar_nivel_motivacion` CHECK (((`nivel_motivacion` between 1 and 5) and (`nivel_motivacion` = floor(`nivel_motivacion`))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `evaluaciones` (
  `id_evaluacion` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `id_evaluador` int NOT NULL,
  `fecha` date NOT NULL,
  `periodo` varchar(50) DEFAULT NULL,
  `puntaje_final` decimal(5,2) DEFAULT NULL,
  `semaforo` varchar(20) DEFAULT NULL,
  `es_periodo_prueba` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id_evaluacion`),
  KEY `id_empleado` (`id_empleado`),
  KEY `id_evaluador` (`id_evaluador`),
  CONSTRAINT `evaluaciones_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE,
  CONSTRAINT `evaluaciones_ibfk_2` FOREIGN KEY (`id_evaluador`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `detalle_eval` (
  `id_detalle` int NOT NULL AUTO_INCREMENT,
  `id_evaluacion` int NOT NULL,
  `id_competencia` int NOT NULL,
  `puntaje_obtenido` decimal(5,2) NOT NULL,
  `justificacion` text NOT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `id_evaluacion` (`id_evaluacion`),
  KEY `id_competencia` (`id_competencia`),
  CONSTRAINT `detalle_eval_ibfk_1` FOREIGN KEY (`id_evaluacion`) REFERENCES `evaluaciones` (`id_evaluacion`) ON DELETE CASCADE,
  CONSTRAINT `detalle_eval_ibfk_2` FOREIGN KEY (`id_competencia`) REFERENCES `competencias` (`id_competencia`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `feedback_ia_evaluaciones` (
  `id_feedback` int NOT NULL AUTO_INCREMENT,
  `id_evaluacion` int NOT NULL,
  `id_empleado` int NOT NULL,
  `analisis_generado` text NOT NULL,
  `recomendacion_corta` varchar(255) DEFAULT NULL,
  `fecha_generacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_feedback`),
  UNIQUE KEY `uq_feedback_evaluacion` (`id_evaluacion`),
  KEY `feedback_ia_ibfk_2` (`id_empleado`),
  CONSTRAINT `feedback_ia_ibfk_1` FOREIGN KEY (`id_evaluacion`) REFERENCES `evaluaciones` (`id_evaluacion`) ON DELETE CASCADE,
  CONSTRAINT `feedback_ia_ibfk_2` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `metas_empleado` (
  `id_meta` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `id_evaluador` int NOT NULL COMMENT 'Usuario que asignó la meta',
  `titulo` varchar(150) NOT NULL,
  `descripcion` text,
  `estado` varchar(50) DEFAULT 'Pendiente',
  `progreso` int DEFAULT '0',
  `fecha_limite` date DEFAULT NULL,
  `fecha_completada` date DEFAULT NULL,
  `comentarios_empleado` text,
  PRIMARY KEY (`id_meta`),
  KEY `idx_metas_empleado` (`id_empleado`),
  KEY `metas_ibfk_2` (`id_evaluador`),
  CONSTRAINT `metas_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE,
  CONSTRAINT `metas_ibfk_2` FOREIGN KEY (`id_evaluador`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `planes_accion` (
  `id_plan` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `id_evaluacion` int NOT NULL,
  `objetivo` text NOT NULL,
  `fecha_limite` date DEFAULT NULL,
  `estado_cumplimiento` varchar(50) DEFAULT 'Pendiente',
  PRIMARY KEY (`id_plan`),
  KEY `id_empleado` (`id_empleado`),
  KEY `id_evaluacion` (`id_evaluacion`),
  CONSTRAINT `planes_accion_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE,
  CONSTRAINT `planes_accion_ibfk_2` FOREIGN KEY (`id_evaluacion`) REFERENCES `evaluaciones` (`id_evaluacion`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `historial_duelos_ia` (
  `id_duelo` int NOT NULL AUTO_INCREMENT,
  `id_admin` int NOT NULL,
  `id_empleado_a` int NOT NULL,
  `id_empleado_b` int NOT NULL,
  `id_empleado_ganador` int DEFAULT NULL,
  `analisis_comparativo` text NOT NULL,
  `fecha_duelo` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_duelo`),
  KEY `idx_duelo_admin` (`id_admin`),
  KEY `idx_duelo_empA` (`id_empleado_a`),
  KEY `idx_duelo_empB` (`id_empleado_b`),
  KEY `duelo_ia_ibfk_4` (`id_empleado_ganador`),
  CONSTRAINT `duelo_ia_ibfk_1` FOREIGN KEY (`id_admin`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `duelo_ia_ibfk_2` FOREIGN KEY (`id_empleado_a`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE,
  CONSTRAINT `duelo_ia_ibfk_3` FOREIGN KEY (`id_empleado_b`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE,
  CONSTRAINT `duelo_ia_ibfk_4` FOREIGN KEY (`id_empleado_ganador`) REFERENCES `empleados` (`id_empleado`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `notificaciones` (
  `id_notificacion` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `mensaje` text NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `leida` tinyint(1) DEFAULT '0',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_notificacion`),
  KEY `idx_notificaciones_usuario` (`id_usuario`),
  CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------
-- 2. INSERCIÓN DE DATOS (en orden de FK)
-- Contraseña de empleados: 1234
-- Contraseña admin: admin123
-- ------------------------------------------

SET @PASS_EMP = '$2b$10$JS9VQSO/c5AZKaP.Jbbo5Oo/1./44QTygSfmtcni.z2n2RgO5zUru';

INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `email`, `empresa`, `password`, `rol`, `creado_en`, `avatar_url`) VALUES
(1, 'Administrador', 'SAPE', 'admin@sape.com', 'S.A.P.E.', '$2b$10$BMnSUnDm7sAoMPgB0ZbKVeobnHqpuFJGJTrErPDJbP2QZ5zoYcRcS', 'administrador', '2026-11-11 19:05:39', NULL), 
(2, 'Lucas', 'Mendoza', 'lucas.mendoza@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:00:00', NULL),
(3, 'Valentina', 'Ríos', 'valentina.rios@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:01:00', NULL),
(4, 'Mateo', 'Silva', 'mateo.silva@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:02:00', NULL),
(5, 'Camila', 'Navarro', 'camila.navarro@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:03:00', NULL),
(6, 'Joaquín', 'Castro', 'joaquin.castro@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:04:00', NULL),
(7, 'Martina', 'Ortiz', 'martina.ortiz@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:05:00', NULL),
(8, 'Sebastián', 'Vega', 'sebastian.vega@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:06:00', NULL),
(9, 'Antonella', 'Paz', 'antonella.paz@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:07:00', NULL),
(10, 'Facundo', 'Domínguez', 'facundo.dominguez@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:08:00', NULL),
(11, 'Carolina', 'Rojas', 'carolina.rojas@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:09:00', NULL),
(12, 'Emiliano', 'Cabrera', 'emiliano.cabrera@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:10:00', NULL),
(13, 'Agustina', 'Molina', 'agustina.molina@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:11:00', NULL),
(14, 'Ignacio', 'Ruiz', 'ignacio.ruiz@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:12:00', NULL),
(15, 'Milagros', 'Aguilar', 'milagros.aguilar@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:13:00', NULL),
(16, 'Santiago', 'Vargas', 'santiago.vargas@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:14:00', NULL),
(17, 'Delfina', 'Herrera', 'delfina.herrera@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:15:00', NULL),
(18, 'Bautista', 'Gutiérrez', 'bautista.gutierrez@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:16:00', NULL),
(19, 'Candela', 'Sosa', 'candela.sosa@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:17:00', NULL),
(20, 'Thiago', 'Giménez', 'thiago.gimenez@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:18:00', NULL),
(21, 'Malena', 'Luna', 'malena.luna@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:19:00', NULL),
(22, 'Tomás', 'Juárez', 'tomas.juarez@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:20:00', NULL),
(23, 'Abril', 'Pereyra', 'abril.pereyra@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:21:00', NULL),
(24, 'Lautaro', 'Bustos', 'lautaro.bustos@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:22:00', NULL),
(25, 'Renata', 'Vega', 'renata.vega@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:23:00', NULL),
(26, 'Jerónimo', 'Figueroa', 'jeronimo.figueroa@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:24:00', NULL),
(27, 'Zoe', 'Ibarra', 'zoe.ibarra@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:25:00', NULL),
(28, 'Franco', 'Carrasco', 'franco.carrasco@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:26:00', NULL),
(29, 'Alma', 'Delgado', 'alma.delgado@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:27:00', NULL),
(30, 'Ramiro', 'Cárdenas', 'ramiro.cardenas@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:28:00', NULL),
(31, 'Josefina', 'Quiroga', 'josefina.quiroga@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:29:00', NULL),
(32, 'Valentín', 'Mansilla', 'valentin.mansilla@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:30:00', NULL),
(33, 'Bianca', 'Salazar', 'bianca.salazar@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:31:00', NULL),
(34, 'Gael', 'Peña', 'gael.pena@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:32:00', NULL),
(35, 'Olivia', 'Araya', 'olivia.araya@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:33:00', NULL),
(36, 'Nahuel', 'Godoy', 'nahuel.godoy@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:34:00', NULL),
(37, 'Catalina', 'Ponce', 'catalina.ponce@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:35:00', NULL),
(38, 'Simón', 'Ledesma', 'simon.ledesma@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:36:00', NULL),
(39, 'Julieta', 'Correa', 'julieta.correa@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:37:00', NULL),
(40, 'Alejo', 'Montenegro', 'alejo.montenegro@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:38:00', NULL),
(41, 'Emilia', 'Báez', 'emilia.baez@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:39:00', NULL),
(42, 'Bruno', 'Ferreira', 'bruno.ferreira@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:40:00', NULL),
(43, 'Mía', 'Velázquez', 'mia.velazquez@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:41:00', NULL),
(44, 'Tobías', 'Sandoval', 'tobias.sandoval@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:42:00', NULL),
(45, 'Lola', 'Escobar', 'lola.escobar@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:43:00', NULL),
(46, 'Ciro', 'Ramos', 'ciro.ramos@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:44:00', NULL),
(47, 'Pilar', 'Villalba', 'pilar.villalba@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:45:00', NULL),
(48, 'Dante', 'Aguirre', 'dante.aguirre@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:46:00', NULL),
(49, 'Ámbar', 'Córdoba', 'ambar.cordoba@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:47:00', NULL),
(50, 'Benjamín', 'Bravo', 'benjamin.bravo@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:48:00', NULL),
(51, 'Sofía', 'Castellanos', 'sofia.castellanos@sape.com', 'S.A.P.E.', @PASS_EMP, 'empleado', '2026-11-18 08:49:00', NULL);

INSERT INTO `departamentos` (`id_departamento`, `nombre`, `presupuesto`) VALUES
(1, 'Desarrollo de Software', 50000.00),
(2, 'Recursos Humanos', 30000.00),
(3, 'Infraestructura y DevOps', 40000.00);

INSERT INTO `puestos` (`id_puesto`, `id_departamento`, `nombre`, `seniority`) VALUES
(1, 1, 'Desarrollador Junior', 'Junior'),
(2, 1, 'Desarrollador Semi-Senior', 'Semi-Senior'),
(3, 1, 'Desarrollador Senior', 'Senior'),
(4, 2, 'Analista de Selección', 'Semi-Senior'),
(5, 3, 'Soporte Técnico', 'Junior');

INSERT INTO `competencias` (`id_competencia`, `nombre`, `tipo_skill`) VALUES
(1, 'Calidad de Código y Arquitectura', 'Técnica'),
(2, 'Resolución de Problemas', 'Técnica'),
(3, 'Comunicación y Trabajo en Equipo', 'Blanda'),
(4, 'Gestión del Tiempo y Entrega', 'Blanda');

INSERT INTO `proyectos` (`id_proyecto`, `nombre`, `estado`, `fecha_fin`) VALUES
(1, 'Portal Analítico S.A.P.E.', 'En curso', '2026-12-20'),
(2, 'Automatización de Check-ins', 'En curso', '2027-01-15'),
(3, 'Onboarding y Selección Digital', 'Planificado', '2027-02-10');

INSERT INTO `empleados` (`id_empleado`, `id_puesto`, `legajo`, `fecha_ingreso`, `en_periodo_prueba`, `id_usuario`) VALUES
(1, 1, 'LEG-001', '2025-01-10', 0, 2),
(2, 2, 'LEG-002', '2025-01-15', 0, 3),
(3, 1, 'LEG-003', '2025-02-01', 0, 4),
(4, 4, 'LEG-004', '2025-02-12', 0, 5),
(5, 3, 'LEG-005', '2025-03-01', 0, 6),
(6, 2, 'LEG-006', '2025-03-10', 0, 7),
(7, 5, 'LEG-007', '2025-04-01', 0, 8),
(8, 1, 'LEG-008', '2025-04-15', 0, 9),
(9, 2, 'LEG-009', '2025-05-02', 0, 10),
(10, 4, 'LEG-010', '2025-05-20', 0, 11),
(11, 3, 'LEG-011', '2025-06-01', 0, 12),
(12, 1, 'LEG-012', '2025-06-15', 0, 13),
(13, 2, 'LEG-013', '2025-07-01', 0, 14),
(14, 5, 'LEG-014', '2025-07-18', 0, 15),
(15, 1, 'LEG-015', '2025-08-01', 0, 16),
(16, 4, 'LEG-016', '2025-08-12', 0, 17),
(17, 2, 'LEG-017', '2025-09-01', 0, 18),
(18, 3, 'LEG-018', '2025-09-15', 0, 19),
(19, 1, 'LEG-019', '2025-10-01', 0, 20),
(20, 5, 'LEG-020', '2025-10-14', 0, 21),
(21, 2, 'LEG-021', '2025-11-01', 0, 22),
(22, 1, 'LEG-022', '2025-11-18', 0, 23),
(23, 4, 'LEG-023', '2025-12-01', 0, 24),
(24, 3, 'LEG-024', '2025-12-15', 0, 25),
(25, 1, 'LEG-025', '2026-01-08', 0, 26),
(26, 2, 'LEG-026', '2026-01-22', 0, 27),
(27, 5, 'LEG-027', '2026-02-04', 0, 28),
(28, 1, 'LEG-028', '2026-02-18', 0, 29),
(29, 4, 'LEG-029', '2026-03-03', 0, 30),
(30, 2, 'LEG-030', '2026-03-17', 0, 31),
(31, 3, 'LEG-031', '2026-04-01', 0, 32),
(32, 1, 'LEG-032', '2026-04-16', 0, 33),
(33, 5, 'LEG-033', '2026-05-04', 0, 34),
(34, 2, 'LEG-034', '2026-05-19', 0, 35),
(35, 1, 'LEG-035', '2026-06-02', 0, 36),
(36, 4, 'LEG-036', '2026-06-18', 0, 37),
(37, 2, 'LEG-037', '2026-07-01', 0, 38),
(38, 3, 'LEG-038', '2026-07-15', 0, 39),
(39, 1, 'LEG-039', '2026-08-03', 0, 40),
(40, 5, 'LEG-040', '2026-08-19', 0, 41),
(41, 1, 'PRB-041', '2026-09-01', 1, 42),
(42, 2, 'PRB-042', '2026-09-14', 1, 43),
(43, 4, 'PRB-043', '2026-09-28', 1, 44),
(44, 1, 'PRB-044', '2026-10-05', 1, 45),
(45, 5, 'PRB-045', '2026-10-12', 1, 46),
(46, 1, 'PRB-046', '2026-10-19', 1, 47),
(47, 2, 'PRB-047', '2026-10-26', 1, 48),
(48, 1, 'PRB-048', '2026-11-02', 1, 49),
(49, 4, 'PRB-049', '2026-11-09', 1, 50),
(50, 1, 'PRB-050', '2026-11-16', 1, 51);

INSERT INTO `asignaciones` (`id_asignacion`, `id_empleado`, `id_proyecto`, `horas_asignadas`, `rol_en_proyecto`) VALUES
(1, 1, 1, 20, 'Desarrollador Frontend'),
(2, 2, 1, 25, 'Desarrollador Full Stack'),
(3, 5, 1, 30, 'Arquitecto y Líder Técnico'),
(4, 3, 2, 20, 'Desarrollador Backend'),
(5, 7, 2, 15, 'Soporte y Monitoreo'),
(6, 4, 3, 20, 'Analista de Procesos RRHH');

INSERT INTO `checkins_empleado` (`id_checkin`, `id_empleado`, `fecha`, `nivel_motivacion`, `carga_trabajo`, `logros_semana`, `obstaculos`, `creado_en`, `link_evidencia`) VALUES
(1, 1, '2026-11-04', 4, 3, 'Maquetación de vistas principales y tablas de desempeño.', 'Ninguno relevante.', '2026-11-04 18:00:00', 'https://github.com/sape-demo/frontend/pull/10'),
(2, 1, '2026-11-11', 5, 3, 'Integración de filtros y exportación de reportes.', 'Pequeño ajuste de estilos responsive.', '2026-11-11 18:00:00', 'https://github.com/sape-demo/frontend/pull/14'),
(3, 2, '2026-11-05', 4, 3, 'Endpoints REST de evaluaciones y validación de JWT.', 'Ninguno.', '2026-11-05 17:30:00', 'https://github.com/sape-demo/backend/pull/8'),
(4, 2, '2026-11-12', 4, 4, 'Optimización de consultas SQL y manejo de errores.', 'Demora en revisión de PRs.', '2026-11-12 17:45:00', 'https://github.com/sape-demo/backend/pull/12'),
(5, 3, '2026-11-06', 2, 5, 'Corrección parcial de incidencias en entorno de pruebas.', 'Alta carga de tareas simultáneas.', '2026-11-06 19:00:00', 'https://github.com/sape-demo/backend/pull/9'),
(6, 4, '2026-11-10', 4, 2, 'Actualización de grilla de competencias y criterios.', 'Ninguno.', '2026-11-10 16:00:00', 'https://github.com/sape-demo/docs/commit/11aa22bb'),
(7, 5, '2026-11-13', 5, 4, 'Revisión de arquitectura y mejoras de rendimiento en MySQL.', 'Coordinación de horarios de despliegue.', '2026-11-13 18:20:00', 'https://github.com/sape-demo/backend/pull/15'),
(8, 41, '2026-11-14', 2, 4, 'Avance inicial en módulo de registro de candidatos.', 'Falta de claridad en reglas de validación.', '2026-11-14 15:10:00', 'https://github.com/sape-demo/frontend/pull/18');

INSERT INTO `evaluaciones` (`id_evaluacion`, `id_empleado`, `id_evaluador`, `fecha`, `periodo`, `puntaje_final`, `semaforo`, `es_periodo_prueba`) VALUES
(1, 1, 1, '2026-10-30', 'Octubre 2026', 85.00, 'Verde', 0),
(2, 1, 1, '2026-11-18', 'Noviembre 2026', 90.00, 'Verde', 0),
(3, 2, 1, '2026-10-30', 'Octubre 2026', 82.00, 'Verde', 0),
(4, 2, 1, '2026-11-18', 'Noviembre 2026', 86.00, 'Verde', 0),
(5, 3, 1, '2026-11-18', 'Noviembre 2026', 58.00, 'Amarillo', 0),
(6, 4, 1, '2026-11-18', 'Noviembre 2026', 78.00, 'Verde', 0),
(7, 5, 1, '2026-11-18', 'Noviembre 2026', 92.00, 'Verde', 0),
(8, 41, 1, '2026-11-19', 'Noviembre 2026', 45.00, 'Rojo', 1);

INSERT INTO `detalle_eval` (`id_detalle`, `id_evaluacion`, `id_competencia`, `puntaje_obtenido`, `justificacion`) VALUES
(1, 1, 1, 85.00, 'Componentes limpios y reutilizables en React.'),
(2, 1, 3, 85.00, 'Buena comunicación con el equipo.'),
(3, 3, 1, 82.00, 'Consultas SQL ordenadas y buen manejo de API.'),
(4, 5, 4, 58.00, 'Necesita priorizar tareas para cumplir plazos.'),
(5, 8, 2, 45.00, 'Requiere acompañamiento en resolución de bloqueos técnicos.');

INSERT INTO `feedback_ia_evaluaciones` (`id_feedback`, `id_evaluacion`, `id_empleado`, `analisis_generado`, `recomendacion_corta`, `fecha_generacion`) VALUES
(1, 1, 1, 'Lucas Mendoza mantiene un desempeño sólido en octubre con 85 puntos (semáforo verde). Se destaca la entrega consistente de vistas y buena comunicación.', 'Mantener el ritmo de entregas y documentar componentes.', '2026-10-30 20:00:00'),
(2, 2, 1, 'En noviembre Lucas elevó su puntaje a 90 puntos (semáforo verde), consolidando mejoras en filtros y reportes.', 'Consolidar buenas prácticas de UI y apoyar en revisiones.', '2026-11-18 19:00:00'),
(3, 3, 2, 'Valentina Ríos obtuvo 82 puntos en octubre (semáforo verde), con buen rendimiento en endpoints y validación JWT.', 'Sostener cobertura de pruebas en rutas críticas.', '2026-10-30 20:15:00'),
(4, 5, 3, 'Mateo Silva registró 58 puntos (semáforo amarillo) con carga de trabajo alta. Conviene priorizar tareas y definir límites semanales.', 'Priorizar backlog y revisar carga con el líder.', '2026-11-18 19:10:00'),
(5, 8, 41, 'Emilia Báez obtuvo 45 puntos en período de prueba (semáforo rojo). Se recomienda acompañamiento cercano y aclaración de criterios.', 'Reforzar seguimiento semanal en período de prueba.', '2026-11-19 11:00:00');

INSERT INTO `metas_empleado` (`id_meta`, `id_empleado`, `id_evaluador`, `titulo`, `descripcion`, `estado`, `progreso`, `fecha_limite`, `fecha_completada`, `comentarios_empleado`) VALUES
(1, 1, 1, 'Documentar componentes clave de frontend', 'Redactar ejemplos de uso y props para las tablas y filtros principales.', 'Completada', 100, '2026-11-30', '2026-11-18', 'Documentación terminada y revisada.'),
(2, 2, 1, 'Reducir tiempos de revisión de Pull Requests', 'Establecer acuerdos de revisión para bajar el tiempo de espera en ramas de desarrollo.', 'En progreso', 50, '2026-12-15', NULL, 'Se definió revisión diaria en horario acordado.'),
(3, 3, 1, 'Mejorar priorización y gestión de carga', 'Organizar tareas críticas al inicio de la semana y alertar cuellos de botella a tiempo.', 'Pendiente', 20, '2026-12-18', NULL, NULL),
(4, 41, 1, 'Clarificar requerimientos del módulo de candidatos', 'Validar reglas de negocio y casos borde antes de implementar nuevas pantallas.', 'En progreso', 35, '2026-12-10', NULL, 'Reunión realizada para aclarar campos obligatorios.');

INSERT INTO `planes_accion` (`id_plan`, `id_empleado`, `id_evaluacion`, `objetivo`, `fecha_limite`, `estado_cumplimiento`) VALUES
(1, 3, 5, 'Reorganizar prioridades de tareas y revisar carga semanal con el líder técnico.', '2026-12-15', 'Pendiente'),
(2, 41, 8, 'Realizar seguimiento quincenal de progreso y criterios de aceptación durante el período de prueba.', '2026-12-12', 'Pendiente');

INSERT INTO `historial_duelos_ia` (`id_duelo`, `id_admin`, `id_empleado_a`, `id_empleado_b`, `id_empleado_ganador`, `analisis_comparativo`, `fecha_duelo`) VALUES
(1, 1, 1, 2, 2, 'Comparativa entre Lucas Mendoza (85/90, verde, motivación alta) y Valentina Ríos (82/86, verde, sólida en backend). Ambos muestran evolución positiva; Valentina destaca en estabilidad de API y Lucas en entrega de interfaz.', '2026-11-19 10:00:00');

INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `titulo`, `mensaje`, `tipo`, `leida`, `fecha_creacion`) VALUES
(1, 2, 'Nueva evaluación', 'Se registró tu evaluación correspondiente al período Noviembre 2026.', 'evaluacion', 0, '2026-11-18 19:00:00'),
(2, 3, 'Nueva meta asignada', 'Se asignó una nueva meta de desarrollo: Reducir tiempos de revisión de Pull Requests.', 'meta', 0, '2026-11-18 19:05:00'),
(3, 4, 'Recordatorio de evaluación', 'Ya podés consultar los resultados de tu evaluación de Noviembre 2026.', 'evaluacion', 1, '2026-11-18 19:15:00'),
(4, 1, 'Alerta preventiva de fatiga', 'El último check-in de Mateo Silva registra motivación baja y carga alta.', 'alerta_fatiga', 0, '2026-11-19 09:00:00');

-- ------------------------------------------
-- 3. AJUSTE DE AUTO_INCREMENT
-- ------------------------------------------

ALTER TABLE `usuarios` AUTO_INCREMENT = 52;
ALTER TABLE `departamentos` AUTO_INCREMENT = 4;
ALTER TABLE `puestos` AUTO_INCREMENT = 6;
ALTER TABLE `competencias` AUTO_INCREMENT = 5;
ALTER TABLE `proyectos` AUTO_INCREMENT = 4;
ALTER TABLE `empleados` AUTO_INCREMENT = 51;
ALTER TABLE `asignaciones` AUTO_INCREMENT = 7;
ALTER TABLE `checkins_empleado` AUTO_INCREMENT = 9;
ALTER TABLE `evaluaciones` AUTO_INCREMENT = 9;
ALTER TABLE `detalle_eval` AUTO_INCREMENT = 6;
ALTER TABLE `feedback_ia_evaluaciones` AUTO_INCREMENT = 6;
ALTER TABLE `metas_empleado` AUTO_INCREMENT = 5;
ALTER TABLE `planes_accion` AUTO_INCREMENT = 3;
ALTER TABLE `historial_duelos_ia` AUTO_INCREMENT = 2;
ALTER TABLE `notificaciones` AUTO_INCREMENT = 5;
ALTER TABLE `asignaciones`
  ADD UNIQUE KEY `uq_asignacion_empleado_proyecto`
  (`id_empleado`, `id_proyecto`);