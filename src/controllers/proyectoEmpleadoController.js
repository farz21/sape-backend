const db = require("../config/db");

// ==========================================
// OBTENER PROYECTOS ASIGNADOS DEL EMPLEADO
// ==========================================
const obtenerMisProyectos = async (req, res) => {
  const idUsuario = req.usuario.id;

  try {
    const [empleados] = await db.execute(
      "SELECT id_empleado FROM empleados WHERE id_usuario = ? LIMIT 1",
      [idUsuario],
    );

    if (empleados.length === 0) {
      return res.status(404).json({
        mensaje: "No se encontró un perfil de empleado asociado a tu usuario.",
      });
    }

    const idEmpleado = empleados[0].id_empleado;

    const [asignaciones] = await db.execute(
      `SELECT
        a.id_asignacion,
        a.id_proyecto,
        a.horas_asignadas,
        a.rol_en_proyecto,
        p.nombre AS nombre_proyecto,
        p.estado,
        p.fecha_fin
       FROM asignaciones a
       INNER JOIN proyectos p ON a.id_proyecto = p.id_proyecto
       WHERE a.id_empleado = ?
       ORDER BY p.fecha_fin ASC, a.id_asignacion ASC`,
      [idEmpleado],
    );

    return res.status(200).json(asignaciones);
  } catch (error) {
    console.error("Error al obtener proyectos asignados del empleado:", error);
    return res.status(500).json({
      mensaje: "Error al obtener los proyectos asignados.",
    });
  }
};

module.exports = {
  obtenerMisProyectos,
};