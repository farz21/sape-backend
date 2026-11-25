const db = require("../config/db");

const estadosValidos = ["Pendiente", "En progreso", "Completada"];

const obtenerMisMetas = async (req, res) => {
  try {
    const [empleados] = await db.execute(
      "SELECT id_empleado FROM empleados WHERE id_usuario = ?",
      [req.usuario.id],
    );

    if (!empleados.length) {
      return res.status(403).json({
        mensaje: "Tu usuario no tiene un perfil de empleado asociado.",
      });
    }

    const [metas] = await db.execute(
      "SELECT * FROM metas_empleado WHERE id_empleado = ? ORDER BY fecha_limite ASC",
      [empleados[0].id_empleado],
    );

    return res.status(200).json(metas);
  } catch (error) {
    console.error("Error al obtener metas:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

const actualizarProgresoMeta = async (req, res) => {
  const { progreso, estado, comentarios_empleado } = req.body;

  if (
    !Number.isInteger(Number(progreso)) ||
    Number(progreso) < 0 ||
    Number(progreso) > 100
  ) {
    return res
      .status(400)
      .json({ mensaje: "El progreso debe estar entre 0 y 100." });
  }

  try {
    const [empleados] = await db.execute(
      "SELECT id_empleado FROM empleados WHERE id_usuario = ?",
      [req.usuario.id],
    );

    if (!empleados.length) {
      return res.status(403).json({
        mensaje: "Tu usuario no tiene un perfil de empleado asociado.",
      });
    }

    const estadoFinal =
      Number(progreso) === 100
        ? "Completada"
        : estado === "En progreso"
          ? "En progreso"
          : "Pendiente";

    const fechaCompletada =
      estadoFinal === "Completada"
        ? new Date().toISOString().slice(0, 10)
        : null;

    const [resultado] = await db.execute(
      `UPDATE metas_empleado
       SET progreso = ?, estado = ?, comentarios_empleado = ?, fecha_completada = ?
       WHERE id_meta = ? AND id_empleado = ?`,
      [
        Number(progreso),
        estadoFinal,
        comentarios_empleado || null,
        fechaCompletada,
        req.params.id,
        empleados[0].id_empleado,
      ],
    );

    if (!resultado.affectedRows) {
      return res.status(404).json({ mensaje: "Meta no encontrada." });
    }

    return res.status(200).json({
      mensaje: "Progreso de la meta actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error al actualizar meta:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

const obtenerMetasAdmin = async (req, res) => {
  try {
    const parametros = [];

    let sql = `SELECT m.*, u.nombre, u.apellido, e.legajo
      FROM metas_empleado m
      INNER JOIN empleados e ON e.id_empleado = m.id_empleado
      INNER JOIN usuarios u ON u.id = e.id_usuario`;

    const condiciones = [];

    if (req.query.id_empleado) {
      condiciones.push("m.id_empleado = ?");
      parametros.push(req.query.id_empleado);
    }

    if (req.query.estado) {
      condiciones.push("m.estado = ?");
      parametros.push(req.query.estado);
    }

    if (condiciones.length) {
      sql += ` WHERE ${condiciones.join(" AND ")}`;
    }

    sql +=
      " ORDER BY m.fecha_limite IS NULL, m.fecha_limite ASC, m.id_meta DESC";

    const [metas] = await db.execute(sql, parametros);

    return res.status(200).json(metas);
  } catch (error) {
    console.error("Error al listar metas:", error);
    return res.status(500).json({ mensaje: "Error al obtener las metas." });
  }
};

const crearMetaAdmin = async (req, res) => {
  const { id_empleado, titulo, descripcion, fecha_limite } = req.body;

  if (!id_empleado || !titulo?.trim()) {
    return res.status(400).json({
      mensaje: "Empleado y titulo son obligatorios.",
    });
  }

  try {
    const [empleados] = await db.execute(
      "SELECT id_usuario FROM empleados WHERE id_empleado = ?",
      [id_empleado],
    );

    if (!empleados.length) {
      return res.status(404).json({ mensaje: "Empleado no encontrado." });
    }

    const [resultado] = await db.execute(
      `INSERT INTO metas_empleado
       (id_empleado, id_evaluador, titulo, descripcion, estado, progreso, fecha_limite)
       VALUES (?, ?, ?, ?, 'Pendiente', 0, ?)`,
      [
        id_empleado,
        req.usuario.id,
        titulo.trim(),
        descripcion?.trim() || null,
        fecha_limite || null,
      ],
    );

    try {
      await db.execute(
        "INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo) VALUES (?, ?, ?, 'meta')",
        [
          empleados[0].id_usuario,
          "Nueva meta asignada",
          `Se te asigno la meta: ${titulo.trim()}.`,
        ],
      );
    } catch (errorNotificacion) {
      console.error(
        "No se pudo crear la notificacion de la meta:",
        errorNotificacion,
      );
    }

    return res.status(201).json({
      mensaje: "Meta creada correctamente.",
      id_meta: resultado.insertId,
    });
  } catch (error) {
    console.error("Error al crear meta:", error);
    return res.status(500).json({ mensaje: "Error al crear la meta." });
  }
};

const actualizarMetaAdmin = async (req, res) => {
  const { titulo, descripcion, estado, progreso, fecha_limite } = req.body;

  if (
    !titulo?.trim() ||
    !estadosValidos.includes(estado) ||
    !Number.isInteger(Number(progreso)) ||
    Number(progreso) < 0 ||
    Number(progreso) > 100
  ) {
    return res.status(400).json({ mensaje: "Revisa los datos de la meta." });
  }

  const estadoFinal = Number(progreso) === 100 ? "Completada" : estado;

  const fechaCompletada =
    estadoFinal === "Completada"
      ? new Date().toISOString().slice(0, 10)
      : null;

  try {
    const [resultado] = await db.execute(
      `UPDATE metas_empleado
       SET titulo = ?, descripcion = ?, estado = ?, progreso = ?, fecha_limite = ?, fecha_completada = ?
       WHERE id_meta = ?`,
      [
        titulo.trim(),
        descripcion?.trim() || null,
        estadoFinal,
        Number(progreso),
        fecha_limite || null,
        fechaCompletada,
        req.params.id,
      ],
    );

    if (!resultado.affectedRows) {
      return res.status(404).json({ mensaje: "Meta no encontrada." });
    }

    return res.status(200).json({
      mensaje: "Meta actualizada correctamente.",
    });
  } catch (error) {
    console.error("Error al actualizar meta:", error);
    return res.status(500).json({
      mensaje: "Error al actualizar la meta.",
    });
  }
};

const eliminarMetaAdmin = async (req, res) => {
  try {
    const [resultado] = await db.execute(
      "DELETE FROM metas_empleado WHERE id_meta = ?",
      [req.params.id],
    );

    if (!resultado.affectedRows) {
      return res.status(404).json({ mensaje: "Meta no encontrada." });
    }

    return res.status(200).json({
      mensaje: "Meta eliminada correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar meta:", error);
    return res.status(500).json({
      mensaje: "Error al eliminar la meta.",
    });
  }
};

module.exports = {
  obtenerMisMetas,
  actualizarProgresoMeta,
  obtenerMetasAdmin,
  crearMetaAdmin,
  actualizarMetaAdmin,
  eliminarMetaAdmin,
};