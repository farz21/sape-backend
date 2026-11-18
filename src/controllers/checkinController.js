const db = require("../config/db");

// ==========================================
// REGISTRAR CHECK-IN
// ==========================================
const registrarCheckin = async (req, res) => {
  try {
    const {
      nivel_motivacion,
      carga_trabajo,
      logros_semana,
      obstaculos,
      link_evidencia,
    } = req.body;

    // Validar campos obligatorios
    if (
      nivel_motivacion === undefined ||
      carga_trabajo === undefined ||
      !link_evidencia?.trim()
    ) {
      return res.status(400).json({
        mensaje: "Completá todos los campos obligatorios, incluida la evidencia.",
      });
    }

    // Validar escalas (1 al 5)
    if (
      !Number.isInteger(Number(nivel_motivacion)) ||
      !Number.isInteger(Number(carga_trabajo)) ||
      nivel_motivacion < 1 ||
      nivel_motivacion > 5 ||
      carga_trabajo < 1 ||
      carga_trabajo > 5
    ) {
      return res.status(400).json({
        mensaje: "Los valores deben estar entre 1 y 5.",
      });
    }

    // Validar formato de URL del enlace de evidencia
    let url;
    try {
      url = new URL(link_evidencia.trim());
    } catch {
      return res.status(400).json({
        mensaje: "Ingresá un enlace válido.",
      });
    }

    if (
      !["http:", "https:"].includes(url.protocol) ||
      link_evidencia.trim().length > 500
    ) {
      return res.status(400).json({
        mensaje: "El enlace debe ser HTTP o HTTPS y no superar 500 caracteres.",
      });
    }

    // Obtener empleado asociado al usuario autenticado
    const [empleados] = await db.execute(
      "SELECT id_empleado FROM empleados WHERE id_usuario = ?",
      [req.usuario.id]
    );

    if (empleados.length === 0) {
      return res.status(404).json({
        mensaje: "No se encontró el empleado asociado.",
      });
    }

    const idEmpleado = empleados[0].id_empleado;

    // Guardar check-in en la base de datos con timestamp exacto (NOW)
    const [resultado] = await db.execute(
      `INSERT INTO checkins_empleado
      (
        id_empleado,
        fecha,
        nivel_motivacion,
        carga_trabajo,
        logros_semana,
        obstaculos,
        link_evidencia
      )
      VALUES (?, NOW(), ?, ?, ?, ?, ?)`,
      [
        idEmpleado,
        Number(nivel_motivacion),
        Number(carga_trabajo),
        logros_semana || null,
        obstaculos || null,
        link_evidencia.trim(),
      ]
    );

    return res.status(201).json({
      mensaje: "Check-in registrado correctamente.",
      id_checkin: resultado.insertId,
    });

  } catch (error) {
    console.error("Error al registrar check-in:", error);

    return res.status(500).json({
      mensaje: "Error interno al registrar el check-in.",
    });
  }
};

// ==========================================
// OBTENER HISTORIAL DEL EMPLEADO
// ==========================================
const obtenerCheckins = async (req, res) => {
  try {
    const [empleados] = await db.execute(
      "SELECT id_empleado FROM empleados WHERE id_usuario = ?",
      [req.usuario.id]
    );

    if (empleados.length === 0) {
      return res.status(404).json({
        mensaje: "No se encontró el empleado.",
      });
    }

    const idEmpleado = empleados[0].id_empleado;

    // 💡 CAMBIO CLAVE: Ordenamos por id_checkin DESC para garantizar que el último ingresado sea siempre el primero
    const [checkins] = await db.execute(
      `SELECT
        id_checkin,
        id_empleado,
        fecha,
        nivel_motivacion,
        carga_trabajo,
        logros_semana,
        obstaculos,
        link_evidencia
      FROM checkins_empleado
      WHERE id_empleado = ?
      ORDER BY id_checkin DESC`,
      [idEmpleado]
    );

    return res.status(200).json(checkins);

  } catch (error) {
    console.error("Error al obtener check-ins:", error);

    return res.status(500).json({
      mensaje: "Error al obtener el historial.",
    });
  }
};
const eliminarCheckinAdmin = async (req, res) => {
  const { id } = req.params; // id_checkin

  try {
    const [resultado] = await db.execute(
      "DELETE FROM checkins_empleado WHERE id_checkin = ?",
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Check-in no encontrado." });
    }

    return res.status(200).json({
      mensaje: "Check-in eliminado correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar check-in:", error);
    return res.status(500).json({
      mensaje: "Error interno al intentar eliminar el check-in.",
    });
  }
};

module.exports = {
  registrarCheckin,
  obtenerCheckins,
  eliminarCheckinAdmin,
};