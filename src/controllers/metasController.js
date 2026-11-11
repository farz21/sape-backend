const db = require('../config/db');

const obtenerMisMetas = async (req, res) => {
  const id_usuario = req.usuario.id;

  try {
    // 1. Verificamos si este usuario tiene un perfil en la tabla 'empleados'
    const [empleados] = await db.execute(
      'SELECT id_empleado FROM empleados WHERE id_usuario = ?', 
      [id_usuario]
    );

    if (empleados.length === 0) {
      return res.status(403).json({ 
        mensaje: "Acceso denegado. Tu usuario no tiene un perfil de empleado asociado." 
      });
    }

    const id_empleado = empleados[0].id_empleado;

    // 2. Traemos las metas asignadas a este empleado específico
    const [metas] = await db.execute(
      'SELECT * FROM metas_empleado WHERE id_empleado = ? ORDER BY fecha_limite ASC',
      [id_empleado]
    );
    
    res.status(200).json(metas);
  } catch (error) {
    console.error("Error al obtener metas:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

const actualizarProgresoMeta = async (req, res) => {
  const id_usuario = req.usuario.id;
  const { id } = req.params; // ID de la meta que viene en la URL
  const { progreso, estado, comentarios_empleado } = req.body;

  try {
    // 1. Verificamos si este usuario tiene un perfil en la tabla 'empleados'
    const [empleados] = await db.execute(
      'SELECT id_empleado FROM empleados WHERE id_usuario = ?', 
      [id_usuario]
    );

    if (empleados.length === 0) {
      return res.status(403).json({ 
        mensaje: "Acceso denegado. Tu usuario no tiene un perfil de empleado asociado." 
      });
    }

    const id_empleado = empleados[0].id_empleado;

    // 2. Calculamos si la meta se completó hoy
    let fecha_completada = null;
    if (progreso === 100 || estado === 'Completada') {
      fecha_completada = new Date().toISOString().split('T')[0];
    }

    // 3. Actualizamos asegurándonos de que la meta le pertenezca a este empleado
    const [resultado] = await db.execute(
      `UPDATE metas_empleado 
       SET progreso = ?, estado = ?, comentarios_empleado = ?, fecha_completada = ? 
       WHERE id_meta = ? AND id_empleado = ?`,
      [progreso, estado, comentarios_empleado, fecha_completada, id, id_empleado]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ 
        mensaje: "Meta no encontrada o no tienes permisos para modificarla." 
      });
    }

    res.status(200).json({ mensaje: "Progreso de la meta actualizado correctamente." });
  } catch (error) {
    console.error("Error al actualizar meta:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

module.exports = { obtenerMisMetas, actualizarProgresoMeta };