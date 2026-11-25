const db = require("../config/db");
const iaService = require("../services/iaService");

const obtenerCompetenciasPorEmpleado = async (idEmpleado) => {
  const [competenciasStats] = await db.execute(
    `SELECT
      c.id_competencia,
      c.nombre,
      c.tipo_skill,
      ROUND(AVG(d.puntaje_obtenido), 2) AS promedio_puntaje,
      COUNT(d.id_detalle) AS cantidad_evaluaciones
     FROM detalle_eval d
     INNER JOIN competencias c ON d.id_competencia = c.id_competencia
     INNER JOIN evaluaciones ev ON d.id_evaluacion = ev.id_evaluacion
     WHERE ev.id_empleado = ?
     GROUP BY c.id_competencia, c.nombre, c.tipo_skill
     ORDER BY c.tipo_skill ASC, c.id_competencia ASC`,
    [idEmpleado],
  );

  return competenciasStats.map((item) => ({
    ...item,
    promedio_puntaje: Number(item.promedio_puntaje),
    cantidad_evaluaciones: Number(item.cantidad_evaluaciones),
  }));
};

const compararEmpleados = async (req, res) => {
  const { id_empleado_a, id_empleado_b } = req.body;
  const id_admin = req.usuario.id;

  console.log("========== INICIO DUELO ==========");
  console.log("IDs recibidos:", id_empleado_a, id_empleado_b);
  console.log("Administrador:", id_admin);

  if (!id_empleado_a || !id_empleado_b) {
    return res.status(400).json({
      mensaje: "Se requieren dos empleados para realizar el duelo.",
    });
  }

  if (Number(id_empleado_a) === Number(id_empleado_b)) {
    return res.status(400).json({
      mensaje: "No se puede comparar a un empleado consigo mismo.",
    });
  }

  try {
    const obtenerDatosEmpleado = async (id) => {
      console.log(`Obteniendo datos del empleado ${id}...`);

      const [empleadoData] = await db.execute(
        `SELECT e.id_empleado, u.nombre, u.apellido, u.email,
                e.fecha_ingreso, e.en_periodo_prueba, p.nombre AS puesto, p.seniority
         FROM empleados e
         JOIN usuarios u ON e.id_usuario = u.id
         JOIN puestos p ON e.id_puesto = p.id_puesto
         WHERE e.id_empleado = ?`,
        [id],
      );

      if (empleadoData.length === 0) return null;

      console.log(`Datos básicos del empleado ${id} obtenidos.`);

      const [evaluaciones] = await db.execute(
        `SELECT periodo, puntaje_final, semaforo, fecha
         FROM evaluaciones
         WHERE id_empleado = ?
         ORDER BY fecha DESC LIMIT 5`,
        [id],
      );

      const [checkins] = await db.execute(
        `SELECT nivel_motivacion, carga_trabajo, logros_semana,
                obstaculos, fecha
         FROM checkins_empleado
         WHERE id_empleado = ?
         ORDER BY fecha DESC LIMIT 3`,
        [id],
      );

      const competencias = await obtenerCompetenciasPorEmpleado(id);

      console.log(`Historial del empleado ${id} obtenido.`);

      return {
        info_general: empleadoData[0],
        evaluaciones,
        ultimos_checkins: checkins,
        competencias,
      };
    };

    console.log("Consultando ambos empleados...");

    const [candidatoA, candidatoB] = await Promise.all([
      obtenerDatosEmpleado(id_empleado_a),
      obtenerDatosEmpleado(id_empleado_b),
    ]);

    if (!candidatoA || !candidatoB) {
      return res.status(404).json({
        mensaje: "Uno o ambos empleados no fueron encontrados en el sistema.",
      });
    }

    const tieneDatosSuficientes = (candidato) => {
      const cantEvaluaciones = Array.isArray(candidato.evaluaciones)
        ? candidato.evaluaciones.length
        : 0;
      const cantCheckins = Array.isArray(candidato.ultimos_checkins)
        ? candidato.ultimos_checkins.length
        : 0;

      return cantEvaluaciones > 0 || cantCheckins > 0;
    };

    const sinDatosA = !tieneDatosSuficientes(candidatoA);
    const sinDatosB = !tieneDatosSuficientes(candidatoB);

    if (sinDatosA || sinDatosB) {
      const nombresSinDatos = [];
      if (sinDatosA) {
        nombresSinDatos.push(
          `${candidatoA.info_general.nombre} ${candidatoA.info_general.apellido}`,
        );
      }
      if (sinDatosB) {
        nombresSinDatos.push(
          `${candidatoB.info_general.nombre} ${candidatoB.info_general.apellido}`,
        );
      }

      return res.status(422).json({
        codigo: "SIN_DATOS_COMPARACION",
        mensaje: `No se puede realizar el duelo porque ${nombresSinDatos.join(
          " y ",
        )} no cuenta con evaluaciones ni check-ins registrados para comparar.`,
      });
    }

    console.log("Ambos perfiles obtenidos correctamente.");
    console.log("Enviando información a Groq IA...");

    const analisisComparativo = await iaService.generarAnalisisDuelo(
      candidatoA,
      candidatoB,
    );

    console.log("IA devolvió el análisis correctamente.");
    console.log("Guardando resultado en la base de datos...");

    const [resultado] = await db.execute(
      `INSERT INTO historial_duelos_ia
       (id_admin, id_empleado_a, id_empleado_b, analisis_comparativo)
       VALUES (?, ?, ?, ?)`,
      [
        id_admin,
        id_empleado_a,
        id_empleado_b,
        JSON.stringify(analisisComparativo),
      ],
    );

    console.log("Duelo guardado correctamente.");
    console.log("========== FIN DUELO ==========");

    return res.status(200).json({
      mensaje: "Duelo y análisis estratégico generado con éxito.",
      id_duelo: resultado.insertId,
      candidato_a: {
        ...candidatoA.info_general,
        evaluaciones: candidatoA.evaluaciones,
        ultimos_checkins: candidatoA.ultimos_checkins,
        competencias: candidatoA.competencias,
      },
      candidato_b: {
        ...candidatoB.info_general,
        evaluaciones: candidatoB.evaluaciones,
        ultimos_checkins: candidatoB.ultimos_checkins,
        competencias: candidatoB.competencias,
      },
      veredicto_ia: analisisComparativo,
    });
  } catch (error) {
    console.error("Error al procesar el duelo:", error);

    return res.status(500).json({
      mensaje: "Error interno al procesar el duelo comparativo.",
      error: error.message,
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
       ORDER BY d.fecha_duelo DESC`,
    );

    res.status(200).json(duelos);
  } catch (error) {
    console.error("Error al obtener el historial de duelos:", error);
    res.status(500).json({ mensaje: "Error al recuperar los duelos." });
  }
};

// Obtener un duelo puntual por ID junto con datos y métricas actuales de ambos empleados
const obtenerDueloPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT d.id_duelo, d.fecha_duelo, d.id_empleado_a, d.id_empleado_b, d.analisis_comparativo
       FROM historial_duelos_ia d
       WHERE d.id_duelo = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Duelo no encontrado." });
    }

    const dueloRow = rows[0];

    const obtenerPerfilCompleto = async (idEmp) => {
      const [empRows] = await db.execute(
        `SELECT e.id_empleado, u.nombre, u.apellido, u.email,
                e.fecha_ingreso, e.en_periodo_prueba, p.nombre AS puesto, p.seniority
         FROM empleados e
         JOIN usuarios u ON e.id_usuario = u.id
         JOIN puestos p ON e.id_puesto = p.id_puesto
         WHERE e.id_empleado = ?`,
        [idEmp],
      );

      const [evaluaciones] = await db.execute(
        `SELECT periodo, puntaje_final, semaforo, fecha
         FROM evaluaciones
         WHERE id_empleado = ?
         ORDER BY fecha DESC LIMIT 5`,
        [idEmp],
      );

      const [checkins] = await db.execute(
        `SELECT nivel_motivacion, carga_trabajo, logros_semana,
                obstaculos, fecha
         FROM checkins_empleado
         WHERE id_empleado = ?
         ORDER BY fecha DESC LIMIT 3`,
        [idEmp],
      );

      const competencias = await obtenerCompetenciasPorEmpleado(idEmp);

      const base = empRows[0] || {
        id_empleado: idEmp,
        nombre: "Empleado",
        apellido: "",
        puesto: "Sin puesto asignado",
        seniority: null,
        fecha_ingreso: null,
        en_periodo_prueba: null,
      };

      return {
        ...base,
        evaluaciones,
        ultimos_checkins: checkins,
        competencias,
      };
    };

    const [candidatoA, candidatoB] = await Promise.all([
      obtenerPerfilCompleto(dueloRow.id_empleado_a),
      obtenerPerfilCompleto(dueloRow.id_empleado_b),
    ]);

    let veredictoParsed = dueloRow.analisis_comparativo;
    if (typeof veredictoParsed === "string") {
      try {
        veredictoParsed = JSON.parse(veredictoParsed);
      } catch {
        veredictoParsed = null;
      }
    }

    return res.status(200).json({
      id_duelo: dueloRow.id_duelo,
      fecha_duelo: dueloRow.fecha_duelo,
      candidato_a: candidatoA,
      candidato_b: candidatoB,
      veredicto_ia: veredictoParsed,
    });
  } catch (error) {
    console.error("Error al obtener duelo por ID:", error);
    return res.status(500).json({ mensaje: "Error al recuperar el duelo." });
  }
};

// Eliminar un duelo del historial
const eliminarDuelo = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute(
      `DELETE FROM historial_duelos_ia WHERE id_duelo = ?`,
      [id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ mensaje: "El duelo indicado no existe o ya fue eliminado." });
    }

    return res.status(200).json({
      mensaje: "Duelo eliminado del historial correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar duelo:", error);
    return res
      .status(500)
      .json({ mensaje: "Error al eliminar el duelo del historial." });
  }
};

module.exports = {
  compararEmpleados,
  obtenerHistorialDuelos,
  obtenerDueloPorId,
  eliminarDuelo,
};