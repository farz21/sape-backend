CREATE DATABASE IF NOT EXISTS sape_db;
USE sape_db;

-- Tabla: competencias
CREATE TABLE competencias (
  id_competencia int NOT NULL AUTO_INCREMENT,
  nombre varchar(100) NOT NULL,
  tipo_skill varchar(50) NOT NULL,
  PRIMARY KEY (id_competencia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla: departamentos
CREATE TABLE departamentos (
  id_departamento int NOT NULL AUTO_INCREMENT,
  nombre varchar(100) NOT NULL,
  presupuesto decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (id_departamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla: proyectos
CREATE TABLE proyectos (
  id_proyecto int NOT NULL AUTO_INCREMENT,
  nombre varchar(150) NOT NULL,
  estado varchar(50) DEFAULT NULL,
  fecha_fin date DEFAULT NULL,
  PRIMARY KEY (id_proyecto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla: puestos
CREATE TABLE puestos (
  id_puesto int NOT NULL AUTO_INCREMENT,
  id_departamento int NOT NULL,
  nombre varchar(100) NOT NULL,
  seniority varchar(50) DEFAULT NULL,
  PRIMARY KEY (id_puesto),
  KEY id_departamento (id_departamento),
  CONSTRAINT puestos_ibfk_1 FOREIGN KEY (id_departamento) REFERENCES departamentos (id_departamento) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla: empleados
CREATE TABLE empleados (
  id_empleado int NOT NULL AUTO_INCREMENT,
  id_puesto int NOT NULL,
  legajo varchar(50) NOT NULL,
  nombre varchar(150) NOT NULL,
  fecha_ingreso date NOT NULL,
  PRIMARY KEY (id_empleado),
  UNIQUE KEY legajo (legajo),
  KEY id_puesto (id_puesto),
  CONSTRAINT empleados_ibfk_1 FOREIGN KEY (id_puesto) REFERENCES puestos (id_puesto) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla: asignaciones
CREATE TABLE asignaciones (
  id_asignacion int NOT NULL AUTO_INCREMENT,
  id_empleado int NOT NULL,
  id_proyecto int NOT NULL,
  horas_asignadas int DEFAULT NULL,
  rol_en_proyecto varchar(100) DEFAULT NULL,
  PRIMARY KEY (id_asignacion),
  KEY id_empleado (id_empleado),
  KEY id_proyecto (id_proyecto),
  CONSTRAINT asignaciones_ibfk_1 FOREIGN KEY (id_empleado) REFERENCES empleados (id_empleado) ON DELETE CASCADE,
  CONSTRAINT asignaciones_ibfk_2 FOREIGN KEY (id_proyecto) REFERENCES proyectos (id_proyecto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla: evaluaciones
CREATE TABLE evaluaciones (
  id_evaluacion int NOT NULL AUTO_INCREMENT,
  id_empleado int NOT NULL,
  id_evaluador int NOT NULL,
  fecha date NOT NULL,
  periodo varchar(50) DEFAULT NULL,
  puntaje_final decimal(5,2) DEFAULT NULL,
  semaforo varchar(20) DEFAULT NULL,
  PRIMARY KEY (id_evaluacion),
  KEY id_empleado (id_empleado),
  KEY id_evaluador (id_evaluador),
  CONSTRAINT evaluaciones_ibfk_1 FOREIGN KEY (id_empleado) REFERENCES empleados (id_empleado) ON DELETE CASCADE,
  CONSTRAINT evaluaciones_ibfk_2 FOREIGN KEY (id_evaluador) REFERENCES empleados (id_empleado) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla: detalle_eval
CREATE TABLE detalle_eval (
  id_detalle int NOT NULL AUTO_INCREMENT,
  id_evaluacion int NOT NULL,
  id_competencia int NOT NULL,
  puntaje_obtenido decimal(5,2) NOT NULL,
  justificacion text NOT NULL,
  PRIMARY KEY (id_detalle),
  KEY id_evaluacion (id_evaluacion),
  KEY id_competencia (id_competencia),
  CONSTRAINT detalle_eval_ibfk_1 FOREIGN KEY (id_evaluacion) REFERENCES evaluaciones (id_evaluacion) ON DELETE CASCADE,
  CONSTRAINT detalle_eval_ibfk_2 FOREIGN KEY (id_competencia) REFERENCES competencias (id_competencia) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla: planes_accion
CREATE TABLE planes_accion (
  id_plan int NOT NULL AUTO_INCREMENT,
  id_empleado int NOT NULL,
  id_evaluacion int NOT NULL,
  objetivo text NOT NULL,
  fecha_limite date DEFAULT NULL,
  estado_cumplimiento varchar(50) DEFAULT 'Pendiente',
  PRIMARY KEY (id_plan),
  KEY id_empleado (id_empleado),
  KEY id_evaluacion (id_evaluacion),
  CONSTRAINT planes_accion_ibfk_1 FOREIGN KEY (id_empleado) REFERENCES empleados (id_empleado) ON DELETE CASCADE,
  CONSTRAINT planes_accion_ibfk_2 FOREIGN KEY (id_evaluacion) REFERENCES evaluaciones (id_evaluacion) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla: usuarios
CREATE TABLE usuarios (
  id int NOT NULL AUTO_INCREMENT,
  nombre varchar(100) NOT NULL,
  apellido varchar(100) NOT NULL,
  email varchar(150) NOT NULL,
  empresa varchar(100) NOT NULL,
  password varchar(255) NOT NULL,
  rol varchar(50) DEFAULT 'empleado',
  creado_en timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY email (email)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Relacion opcional para asociar la cuenta de acceso con la ficha del empleado.
ALTER TABLE empleados
  ADD COLUMN id_usuario INT NULL,
  ADD UNIQUE KEY uq_empleados_id_usuario (id_usuario),
  ADD CONSTRAINT fk_empleados_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id)
    ON DELETE SET NULL;

