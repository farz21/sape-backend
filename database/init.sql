-- ==========================================================
-- SCRIPT DE INICIALIZACIÓN - SISTEMA S.A.P.E.
-- ==========================================================

CREATE DATABASE IF NOT EXISTS sape_db;
USE sape_db;

-- 1. Tabla: departamentos
CREATE TABLE departamentos (
  id_departamento INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  presupuesto DECIMAL(12,2) DEFAULT NULL,
  PRIMARY KEY (id_departamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Tabla: puestos
CREATE TABLE puestos (
  id_puesto INT NOT NULL AUTO_INCREMENT,
  id_departamento INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  seniority VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (id_puesto),
  KEY id_departamento (id_departamento),
  CONSTRAINT puestos_ibfk_1 FOREIGN KEY (id_departamento) REFERENCES departamentos (id_departamento) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Tabla: usuarios (Credenciales y datos personales)
CREATE TABLE usuarios (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  empresa VARCHAR(100) NOT NULL DEFAULT 'S.A.P.E.',
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(50) DEFAULT 'empleado',
  creado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Tabla: empleados (Datos estrictamente laborales y relación 1 a 1 con usuarios)
CREATE TABLE empleados (
  id_empleado INT NOT NULL AUTO_INCREMENT,
  id_usuario INT DEFAULT NULL,
  id_puesto INT NOT NULL,
  legajo VARCHAR(50) NOT NULL,
  fecha_ingreso DATE NOT NULL,
  PRIMARY KEY (id_empleado),
  UNIQUE KEY legajo (legajo),
  UNIQUE KEY uq_empleados_id_usuario (id_usuario),
  KEY id_puesto (id_puesto),
  CONSTRAINT fk_empleados_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id) ON DELETE SET NULL,
  CONSTRAINT empleados_ibfk_1 FOREIGN KEY (id_puesto) REFERENCES puestos (id_puesto) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. Tabla: competencias
CREATE TABLE competencias (
  id_competencia INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  tipo_skill VARCHAR(50) NOT NULL,
  PRIMARY KEY (id_competencia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6. Tabla: proyectos
CREATE TABLE proyectos (
  id_proyecto INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  estado VARCHAR(50) DEFAULT NULL,
  fecha_fin DATE DEFAULT NULL,
  PRIMARY KEY (id_proyecto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 7. Tabla: asignaciones
CREATE TABLE asignaciones (
  id_asignacion INT NOT NULL AUTO_INCREMENT,
  id_empleado INT NOT NULL,
  id_proyecto INT NOT NULL,
  horas_asignadas INT DEFAULT NULL,
  rol_en_proyecto VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (id_asignacion),
  KEY id_empleado (id_empleado),
  KEY id_proyecto (id_proyecto),
  CONSTRAINT asignaciones_ibfk_1 FOREIGN KEY (id_empleado) REFERENCES empleados (id_empleado) ON DELETE CASCADE,
  CONSTRAINT asignaciones_ibfk_2 FOREIGN KEY (id_proyecto) REFERENCES proyectos (id_proyecto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 8. Tabla: evaluaciones
CREATE TABLE evaluaciones (
  id_evaluacion INT NOT NULL AUTO_INCREMENT,
  id_empleado INT NOT NULL,
  id_evaluador INT NOT NULL,
  fecha DATE NOT NULL,
  periodo VARCHAR(50) DEFAULT NULL,
  puntaje_final DECIMAL(5,2) DEFAULT NULL,
  semaforo VARCHAR(20) DEFAULT NULL,
  PRIMARY KEY (id_evaluacion),
  KEY id_empleado (id_empleado),
  KEY id_evaluador (id_evaluador),
  CONSTRAINT evaluaciones_ibfk_1 FOREIGN KEY (id_empleado) REFERENCES empleados (id_empleado) ON DELETE CASCADE,
  CONSTRAINT evaluaciones_ibfk_2 FOREIGN KEY (id_evaluador) REFERENCES empleados (id_empleado) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 9. Tabla: detalle_eval
CREATE TABLE detalle_eval (
  id_detalle INT NOT NULL AUTO_INCREMENT,
  id_evaluacion INT NOT NULL,
  id_competencia INT NOT NULL,
  puntaje_obtenido DECIMAL(5,2) NOT NULL,
  justificacion TEXT NOT NULL,
  PRIMARY KEY (id_detalle),
  KEY id_evaluacion (id_evaluacion),
  KEY id_competencia (id_competencia),
  CONSTRAINT detalle_eval_ibfk_1 FOREIGN KEY (id_evaluacion) REFERENCES evaluaciones (id_evaluacion) ON DELETE CASCADE,
  CONSTRAINT detalle_eval_ibfk_2 FOREIGN KEY (id_competencia) REFERENCES competencias (id_competencia) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 10. Tabla: planes_accion
CREATE TABLE planes_accion (
  id_plan INT NOT NULL AUTO_INCREMENT,
  id_empleado INT NOT NULL,
  id_evaluacion INT NOT NULL,
  objetivo TEXT NOT NULL,
  fecha_limite DATE DEFAULT NULL,
  estado_cumplimiento VARCHAR(50) DEFAULT 'Pendiente',
  PRIMARY KEY (id_plan),
  KEY id_empleado (id_empleado),
  KEY id_evaluacion (id_evaluacion),
  CONSTRAINT planes_accion_ibfk_1 FOREIGN KEY (id_empleado) REFERENCES empleados (id_empleado) ON DELETE CASCADE,
  CONSTRAINT planes_accion_ibfk_2 FOREIGN KEY (id_evaluacion) REFERENCES evaluaciones (id_evaluacion) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ==========================================================
-- DATOS INICIALES (SEEDERS BÁSICOS)
-- ==========================================================

-- Departamento y Puesto inicial para que las altas automáticas no fallen
INSERT INTO departamentos (id_departamento, nombre, presupuesto) VALUES 
(1, 'Tecnología y Desarrollo', 50000.00);

INSERT INTO puestos (id_puesto, id_departamento, nombre, seniority) VALUES 
(1, 1, 'Desarrollador Full Stack', 'Junior');

-- Usuario Administrador por defecto 
-- (Email: admin@sape.com | Contraseña provisional: admin123)
-- El hash corresponde a 'admin123' generado con bcrypt
INSERT INTO usuarios (id, nombre, apellido, email, empresa, password, rol) VALUES 
(1, 'Administrador', 'General', 'admin@sape.com', 'S.A.P.E.', '$2a$10$3z8q2y7K5x3Z2euK7y5x3O5v6K9v0u...', 'administrador');

-- Ficha de empleado asociada al Administrador (por si actúa como evaluador base)
INSERT INTO empleados (id_empleado, id_usuario, id_puesto, legajo, fecha_ingreso) VALUES 
(1, 1, 1, 'ADMIN-001', CURDATE());