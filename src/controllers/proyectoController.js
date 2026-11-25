const db = require("../config/db");

const obtenerProyectos = async (_req, res) => {
  try {
    const [proyectos] = await db.execute(`
      SELECT p.*, COUNT(a.id_asignacion) AS cantidad_asignados
      FROM proyectos p
      LEFT JOIN asignaciones a ON a.id_proyecto = p.id_proyecto
      GROUP BY p.id_proyecto
      ORDER BY p.fecha_fin IS NULL, p.fecha_fin ASC, p.id_proyecto DESC
    `);

    return res.status(200).json(proyectos);
  } catch (error) {
    console.error("Error al listar proyectos:", error);
    return res.status(500).json({ mensaje: "Error al obtener proyectos." });
  }
};

const crearProyecto = async (req, res) => {
  const { nombre, estado, fecha_fin } = req.body;

  if (!nombre?.trim()) {
    return res.status(400).json({ mensaje: "El nombre es obligatorio." });
  }

  try {
    const [resultado] = await db.execute(
      "INSERT INTO proyectos (nombre, estado, fecha_fin) VALUES (?, ?, ?)",
      [nombre.trim(), estado?.trim() || "Planificado", fecha_fin || null],
    );

    return res.status(201).json({
      mensaje: "Proyecto creado correctamente.",
      id_proyecto: resultado.insertId,
    });
  } catch (error) {
    console.error("Error al crear proyecto:", error);
    return res.status(500).json({ mensaje: "Error al crear el proyecto." });
  }
};

const actualizarProyecto = async (req, res) => {
  const { nombre, estado, fecha_fin } = req.body;

  if (!nombre?.trim()) {
    return res.status(400).json({ mensaje: "El nombre es obligatorio." });
  }

  try {
    const [resultado] = await db.execute(
      "UPDATE proyectos SET nombre = ?, estado = ?, fecha_fin = ? WHERE id_proyecto = ?",
      [
        nombre.trim(),
        estado?.trim() || "Planificado",
        fecha_fin || null,
        req.params.id,
      ],
    );

    if (!resultado.affectedRows) {
      return res.status(404).json({ mensaje: "Proyecto no encontrado." });
    }

    return res.status(200).json({
      mensaje: "Proyecto actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error al actualizar proyecto:", error);
    return res.status(500).json({
      mensaje: "Error al actualizar el proyecto.",
    });
  }
};

const eliminarProyecto = async (req, res) => {
  try {
    const [resultado] = await db.execute(
      "DELETE FROM proyectos WHERE id_proyecto = ?",
      [req.params.id],
    );

    if (!resultado.affectedRows) {
      return res.status(404).json({ mensaje: "Proyecto no encontrado." });
    }

    return res.status(200).json({
      mensaje: "Proyecto eliminado correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar proyecto:", error);
    return res.status(500).json({
      mensaje: "Error al eliminar el proyecto.",
    });
  }
};

const obtenerAsignaciones = async (_req, res) => {
  try {
    const [asignaciones] = await db.execute(`
      SELECT
        a.*,
        p.nombre AS proyecto,
        p.estado AS estado_proyecto,
        e.legajo,
        u.nombre,
        u.apellido
      FROM asignaciones a
      INNER JOIN proyectos p ON p.id_proyecto = a.id_proyecto
      INNER JOIN empleados e ON e.id_empleado = a.id_empleado
      INNER JOIN usuarios u ON u.id = e.id_usuario
      ORDER BY p.nombre, u.apellido, u.nombre
    `);

    return res.status(200).json(asignaciones);
  } catch (error) {
    console.error("Error al listar asignaciones:", error);
    return res.status(500).json({
      mensaje: "Error al obtener asignaciones.",
    });
  }
};

const crearAsignacion = async (req, res) => {
  const {
    id_empleado,
    id_proyecto,
    horas_asignadas,
    rol_en_proyecto,
  } = req.body;

  if (
    !id_empleado ||
    !id_proyecto ||
    !Number.isInteger(Number(horas_asignadas)) ||
    Number(horas_asignadas) <= 0 ||
    !rol_en_proyecto?.trim()
  ) {
    return res.status(400).json({
      mensaje: "Completa empleado, proyecto, rol y horas validas.",
    });
  }

  try {
    const [resultado] = await db.execute(
      `INSERT INTO asignaciones
       (id_empleado, id_proyecto, horas_asignadas, rol_en_proyecto)
       VALUES (?, ?, ?, ?)`,
      [
        id_empleado,
        id_proyecto,
        Number(horas_asignadas),
        rol_en_proyecto.trim(),
      ],
    );

    return res.status(201).json({
      mensaje: "Asignacion creada correctamente.",
      id_asignacion: resultado.insertId,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        mensaje: "El empleado ya esta asignado a este proyecto.",
      });
    }

    console.error("Error al crear asignacion:", error);
    return res.status(500).json({
      mensaje: "Error al crear la asignacion.",
    });
  }
};

const actualizarAsignacion = async (req, res) => {
  const { horas_asignadas, rol_en_proyecto } = req.body;

  if (
    !Number.isInteger(Number(horas_asignadas)) ||
    Number(horas_asignadas) <= 0 ||
    !rol_en_proyecto?.trim()
  ) {
    return res.status(400).json({
      mensaje: "Ingresa horas validas y un rol.",
    });
  }

  try {
    const [resultado] = await db.execute(
      `UPDATE asignaciones
       SET horas_asignadas = ?, rol_en_proyecto = ?
       WHERE id_asignacion = ?`,
      [Number(horas_asignadas), rol_en_proyecto.trim(), req.params.id],
    );

    if (!resultado.affectedRows) {
      return res.status(404).json({ mensaje: "Asignacion no encontrada." });
    }

    return res.status(200).json({
      mensaje: "Asignacion actualizada correctamente.",
    });
  } catch (error) {
    console.error("Error al actualizar asignacion:", error);
    return res.status(500).json({
      mensaje: "Error al actualizar la asignacion.",
    });
  }
};

const eliminarAsignacion = async (req, res) => {
  try {
    const [resultado] = await db.execute(
      "DELETE FROM asignaciones WHERE id_asignacion = ?",
      [req.params.id],
    );

    if (!resultado.affectedRows) {
      return res.status(404).json({ mensaje: "Asignacion no encontrada." });
    }

    return res.status(200).json({
      mensaje: "Asignacion eliminada correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar asignacion:", error);
    return res.status(500).json({
      mensaje: "Error al eliminar la asignacion.",
    });
  }
};

module.exports = {
  obtenerProyectos,
  crearProyecto,
  actualizarProyecto,
  eliminarProyecto,
  obtenerAsignaciones,
  crearAsignacion,
  actualizarAsignacion,
  eliminarAsignacion,
};