-- MySQL dump - S.A.P.E. Database
-- Incluye tablas base, módulo de empleados e inteligencia artificial

SET FOREIGN_KEY_CHECKS=0;

-- 1. ELIMINACIÓN DE TABLAS (Orden inverso a las relaciones)
DROP TABLE IF EXISTS `historial_duelos_ia`;
DROP TABLE IF EXISTS `feedback_ia_evaluaciones`;
DROP TABLE IF EXISTS `metas_empleado`;
DROP TABLE IF EXISTS `checkins_empleado`;
DROP TABLE IF EXISTS `asignaciones`;
DROP TABLE IF EXISTS `planes_accion`;
DROP TABLE IF EXISTS `detalle_eval`;
DROP TABLE IF EXISTS `evaluaciones`;
DROP TABLE IF EXISTS `empleados`;
DROP TABLE IF EXISTS `puestos`;
DROP TABLE IF EXISTS `proyectos`;
DROP TABLE IF EXISTS `departamentos`;
DROP TABLE IF EXISTS `competencias`;
DROP TABLE IF EXISTS `usuarios`;

-- 2. CREACIÓN DE TABLAS BASE

CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `empresa` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL COMMENT 'Bcrypt hash',
  `rol` varchar(50) DEFAULT 'empleado',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `competencias` (
  `id_competencia` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `tipo_skill` varchar(50) NOT NULL,
  PRIMARY KEY (`id_competencia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `departamentos` (
  `id_departamento` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `presupuesto` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`id_departamento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `proyectos` (
  `id_proyecto` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  PRIMARY KEY (`id_proyecto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `puestos` (
  `id_puesto` int NOT NULL AUTO_INCREMENT,
  `id_departamento` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `seniority` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_puesto`),
  KEY `id_departamento` (`id_departamento`),
  CONSTRAINT `puestos_ibfk_1` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `empleados` (
  `id_empleado` int NOT NULL AUTO_INCREMENT,
  `id_puesto` int NOT NULL,
  `legajo` varchar(50) NOT NULL,
  `fecha_ingreso` date NOT NULL,
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

CREATE TABLE `evaluaciones` (
  `id_evaluacion` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `id_evaluador` int NOT NULL,
  `fecha` date NOT NULL,
  `periodo` varchar(50) DEFAULT NULL,
  `puntaje_final` decimal(5,2) DEFAULT NULL,
  `semaforo` varchar(20) DEFAULT NULL,
  `es_periodo_prueba` boolean DEFAULT false,
  PRIMARY KEY (`id_evaluacion`),
  KEY `id_empleado` (`id_empleado`),
  KEY `id_evaluador` (`id_evaluador`)
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

-- 3. NUEVAS TABLAS: MÓDULO EMPLEADO

CREATE TABLE `checkins_empleado` (
  `id_checkin` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `fecha` date NOT NULL,
  `nivel_motivacion` int NOT NULL COMMENT 'Escala del 1 al 10',
  `carga_trabajo` int NOT NULL COMMENT 'Escala del 1 al 10',
  `logros_semana` text,
  `obstaculos` text,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_checkin`),
  KEY `idx_checkins_empleado` (`id_empleado`),
  CONSTRAINT `checkins_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `metas_empleado` (
  `id_meta` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `id_evaluador` int NOT NULL COMMENT 'Usuario que asignó la meta',
  `titulo` varchar(150) NOT NULL,
  `descripcion` text,
  `estado` varchar(50) DEFAULT 'Pendiente',
  `progreso` int DEFAULT 0,
  `fecha_limite` date DEFAULT NULL,
  `fecha_completada` date DEFAULT NULL,
  `comentarios_empleado` text,
  PRIMARY KEY (`id_meta`),
  KEY `idx_metas_empleado` (`id_empleado`),
  CONSTRAINT `metas_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE,
  CONSTRAINT `metas_ibfk_2` FOREIGN KEY (`id_evaluador`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. NUEVAS TABLAS: INTELIGENCIA ARTIFICIAL Y DUELOS

CREATE TABLE `feedback_ia_evaluaciones` (
  `id_feedback` int NOT NULL AUTO_INCREMENT,
  `id_evaluacion` int NOT NULL,
  `id_empleado` int NOT NULL,
  `analisis_generado` text NOT NULL,
  `recomendacion_corta` varchar(255) DEFAULT NULL,
  `fecha_generacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_feedback`),
  UNIQUE KEY `uq_feedback_evaluacion` (`id_evaluacion`),
  CONSTRAINT `feedback_ia_ibfk_1` FOREIGN KEY (`id_evaluacion`) REFERENCES `evaluaciones` (`id_evaluacion`) ON DELETE CASCADE,
  CONSTRAINT `feedback_ia_ibfk_2` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE
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
  CONSTRAINT `duelo_ia_ibfk_1` FOREIGN KEY (`id_admin`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `duelo_ia_ibfk_2` FOREIGN KEY (`id_empleado_a`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE,
  CONSTRAINT `duelo_ia_ibfk_3` FOREIGN KEY (`id_empleado_b`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE,
  CONSTRAINT `duelo_ia_ibfk_4` FOREIGN KEY (`id_empleado_ganador`) REFERENCES `empleados` (`id_empleado`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. DATOS POR DEFECTO (ADMINISTRADOR)
-- Contraseña: "admin123" encriptada con Bcrypt (60 caracteres exactos)
INSERT INTO `usuarios` (`nombre`, `apellido`, `email`, `empresa`, `password`, `rol`) 
VALUES ('Administrador', 'SAPE', 'admin@sape.com', 'S.A.P.E.', '$2b$10$EP/V.01xS.3z52vH.CWeReT.dO2T.w0bF4wM7B5r/r.v1Q3hP8l2K', 'administrador');

SET FOREIGN_KEY_CHECKS=1;