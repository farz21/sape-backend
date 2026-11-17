
const db = require("../config/db");

// Obtener las notificaciones del empleado
const obtenerNotificaciones = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;

    const [notificaciones] = await db.execute(
      `SELECT
        id_notificacion,
        titulo,
        mensaje,
        tipo,
        leida,
        fecha_creacion
       FROM notificaciones
       WHERE id_usuario = ?
       ORDER BY fecha_creacion DESC
       LIMIT 30`,
      [id_usuario]
    );

    res.status(200).json(notificaciones);
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    res.status(500).json({
      mensaje: "Error al obtener las notificaciones.",
    });
  }
};

// Marcar una notificación como leída
const marcarNotificacionLeida = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;
    const { id } = req.params;

    const [resultado] = await db.execute(
      `UPDATE notificaciones
       SET leida = 1
       WHERE id_notificacion = ? AND id_usuario = ?`,
      [id, id_usuario]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje: "No se encontró esa notificación.",
      });
    }

    res.status(200).json({
      mensaje: "Notificación marcada como leída.",
    });
  } catch (error) {
    console.error("Error al marcar notificación:", error);
    res.status(500).json({
      mensaje: "Error al actualizar la notificación.",
    });
  }
};

// Marcar todas las notificaciones como leídas
const marcarTodasLeidas = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;

    await db.execute(
      `UPDATE notificaciones
       SET leida = 1
       WHERE id_usuario = ? AND leida = 0`,
      [id_usuario]
    );

    res.status(200).json({
      mensaje: "Todas las notificaciones fueron marcadas como leídas.",
    });
  } catch (error) {
    console.error("Error al marcar todas las notificaciones:", error);
    res.status(500).json({
      mensaje: "Error al actualizar las notificaciones.",
    });
  }
};

// Crear una notificación desde otros controladores
const registrarNotificacion = async ({
  id_usuario,
  titulo,
  mensaje,
  tipo,
}) => {
  const [resultado] = await db.execute(
    `INSERT INTO notificaciones
      (id_usuario, titulo, mensaje, tipo)
     VALUES (?, ?, ?, ?)`,
    [id_usuario, titulo, mensaje, tipo]
  );

  return resultado.insertId;
};

module.exports = {
  obtenerNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  registrarNotificacion,
};
