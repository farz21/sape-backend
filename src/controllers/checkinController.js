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

    // Revisar los 3 check-ins mas recientes. La motivacion baja activa una
    // alerta inmediatamente; la carga muy alta requiere que se sostenga.
    const [ultimosCheckins] = await db.execute(
      `SELECT nivel_motivacion, carga_trabajo
       FROM checkins_empleado
       WHERE id_empleado = ?
       ORDER BY id_checkin DESC
       LIMIT 3`,
      [idEmpleado]
    );

    const ultimaMotivacionBaja =
      ultimosCheckins.length > 0 && Number(ultimosCheckins[0].nivel_motivacion) <= 2;
    const cargasMuyAltas = ultimosCheckins.filter(
      (checkin) => Number(checkin.carga_trabajo) === 5
    ).length;
    const cargaMuyAltaSostenida =
      ultimosCheckins.length === 3 && cargasMuyAltas >= 2;

    if (ultimaMotivacionBaja || cargaMuyAltaSostenida) {
      try {
        const [admins] = await db.execute("SELECT id FROM usuarios WHERE rol = 'administrador'");
        const [datosEmpleado] = await db.execute(
          `SELECT u.nombre, u.apellido
           FROM empleados e
           INNER JOIN usuarios u ON u.id = e.id_usuario
           WHERE e.id_empleado = ?`,
          [idEmpleado]
        );
        const nombreEmpleado = datosEmpleado.length
          ? `${datosEmpleado[0].nombre} ${datosEmpleado[0].apellido}`
          : `Empleado ${idEmpleado}`;

        for (const admin of admins) {
          await db.execute(
            `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo)
             VALUES (?, ?, ?, ?)`,
            [admin.id, "Alerta preventiva de fatiga", ultimaMotivacionBaja
              ? `El ultimo check-in de ${nombreEmpleado} registra motivacion baja. Se recomienda revisar su situacion. Esta alerta no es un diagnostico.`
              : `Los ultimos check-ins de ${nombreEmpleado} muestran carga de trabajo muy alta sostenida. Se recomienda revisar su situacion. Esta alerta no es un diagnostico.`, "alerta_fatiga"]
          );
        }
      } catch (errorAlerta) {
        // Un fallo al crear la alerta no debe hacer que el empleado reintente
        // y duplique el check-in que ya se guardo correctamente.
        console.error("No se pudo crear la alerta preventiva:", errorAlerta);
      }
    }

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
