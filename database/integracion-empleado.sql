-- Migracion aditiva: vincula la cuenta de acceso con la fila laboral.
-- Ejecutar despues del schema base y seleccionar sape_db.
-- No ejecutar de nuevo si la columna/clave ya existe.

ALTER TABLE empleados
  ADD COLUMN id_usuario INT NULL,
  ADD UNIQUE KEY uq_empleados_id_usuario (id_usuario),
  ADD CONSTRAINT fk_empleados_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id)
    ON DELETE SET NULL;

-- Completar una fila por cuenta usando los IDs reales:
-- UPDATE empleados SET id_usuario = 1 WHERE id_empleado = 1;
