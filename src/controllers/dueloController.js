const db = require('../config/db');
const iaService = require('../services/iaService');

const compararEmpleados = async (req, res) => {
  const { id_empleado_a, id_empleado_b } = req.body;
  const id_admin = req.usuario.id;

  console.log("========== INICIO DUELO ==========");
  console.log("IDs recibidos:", id_empleado_a, id_empleado_b);
  console.log("Administrador:", id_admin);

  if (!id_empleado_a || !id_empleado_b) {
    return res.status(400).json({
      mensaje: "Se requieren dos empleados para realizar el duelo."
    });
  }

  if (Number(id_empleado_a) === Number(id_empleado_b)) {
    return res.status(400).json({
      mensaje: "No se puede comparar a un empleado consigo mismo."
    });
  }

  try {
    const obtenerDatosEmpleado = async (id) => {
      console.log(`Obteniendo datos del empleado ${id}...`);

      const [empleadoData] = await db.execute(
        `SELECT e.id_empleado, u.nombre, u.apellido, u.email,
                e.fecha_ingreso, p.nombre AS puesto, p.seniority
         FROM empleados e
         JOIN usuarios u ON e.id_usuario = u.id
         JOIN puestos p ON e.id_puesto = p.id_puesto
         WHERE e.id_empleado = ?`,
        [id]
      );

      if (empleadoData.length === 0) return null;

      console.log(`Datos básicos del empleado ${id} obtenidos.`);

      const [evaluaciones] = await db.execute(
        `SELECT periodo, puntaje_final, semaforo, fecha
         FROM evaluaciones
         WHERE id_empleado = ?
         ORDER BY fecha DESC LIMIT 5`,
        [id]
      );

      const [checkins] = await db.execute(
        `SELECT nivel_motivacion, carga_trabajo, logros_semana,
                obstaculos, fecha
         FROM checkins_empleado
         WHERE id_empleado = ?
         ORDER BY fecha DESC LIMIT 3`,
        [id]
      );

      console.log(`Historial del empleado ${id} obtenido.`);

      return {
        info_general: empleadoData[0],
        evaluaciones,
        ultimos_checkins: checkins
      };
    };

    console.log("Consultando ambos empleados...");

    const [candidatoA, candidatoB] = await Promise.all([
      obtenerDatosEmpleado(id_empleado_a),
      obtenerDatosEmpleado(id_empleado_b)
    ]);

    if (!candidatoA || !candidatoB) {
      return res.status(404).json({
        mensaje: "Uno o ambos empleados no fueron encontrados en el sistema."
      });
    }

    console.log("Ambos perfiles obtenidos correctamente.");
    console.log("Enviando información a Gemini...");

    const analisisComparativo =
      await iaService.generarAnalisisDuelo(candidatoA, candidatoB);

    console.log("Gemini devolvió el análisis correctamente.");
    console.log("Guardando resultado en la base de datos...");

    const [resultado] = await db.execute(
      `INSERT INTO historial_duelos_ia
       (id_admin, id_empleado_a, id_empleado_b, analisis_comparativo)
       VALUES (?, ?, ?, ?)`,
      [id_admin, id_empleado_a, id_empleado_b, analisisComparativo]
    );

    console.log("Duelo guardado correctamente.");
    console.log("========== FIN DUELO ==========");

    return res.status(200).json({
      mensaje: "Duelo y análisis estratégico generado con éxito.",
      id_duelo: resultado.insertId,
      candidato_a: candidatoA.info_general,
      candidato_b: candidatoB.info_general,
      veredicto_ia: analisisComparativo
    });

  } catch (error) {
    console.error("Error al procesar el duelo:", error);

    return res.status(500).json({
      mensaje: "Error interno al procesar el duelo comparativo.",
      error: error.message
    });
  }
};

// Historial de duelos previos realizados por los administradores
const obtenerHistorialDuelos = async (req, res) => {
  try {
    const [duelos] = await db.execute(
      `SELECT d.id_duelo, d.fecha_duelo, d.analisis_comparativo,
              ea.id_empleado AS id_emp_a, ua.nombre AS nombre_a, ua.apellido AS apellido_a,
              eb.id_empleado AS id_emp_b, ub.nombre AS nombre_b, ub.apellido AS apellido_b,
              admin.nombre AS admin_nombre
       FROM historial_duelos_ia d
       JOIN empleados ea ON d.id_empleado_a = ea.id_empleado
       JOIN usuarios ua ON ea.id_usuario = ua.id
       JOIN empleados eb ON d.id_empleado_b = eb.id_empleado
       JOIN usuarios ub ON eb.id_usuario = ub.id
       JOIN usuarios admin ON d.id_admin = admin.id
       ORDER BY d.fecha_duelo DESC`
    );

    res.status(200).json(duelos);
  } catch (error) {
    console.error("Error al obtener el historial de duelos:", error);
    res.status(500).json({ mensaje: "Error al recuperar los duelos." });
  }
};

module.exports = {
  compararEmpleados,
  obtenerHistorialDuelos
};