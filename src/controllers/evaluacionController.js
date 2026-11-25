const db = require("../config/db");
const iaService = require("../services/iaService"); // Importamos el servicio de IA para generar feedback

// Obtener detalle de un empleado, sus evaluaciones (con competencias de detalle_eval), su último check-in y el historial completo de check-ins
const obtenerHistorialEmpleado = async (req, res) => {
  const { id } = req.params;

  try {
    const [empleadoFicha] = await db.execute(
      `SELECT 
        u.id as id_usuario,
        u.nombre,
        u.apellido,
        u.email,
        u.creado_en,
        u.empresa,
        u.avatar_url,
        e.id_empleado,
        e.legajo,
        e.fecha_ingreso,
        e.id_puesto
      FROM empleados e
      LEFT JOIN usuarios u ON e.id_usuario = u.id
      WHERE e.id_empleado = ?`,
      [id],
    );

    if (empleadoFicha.length === 0) {
      return res.status(404).json({
        mensaje: "Empleado no encontrado o sin ficha laboral asignada.",
      });
    }

    const idEmpleadoReal = empleadoFicha[0].id_empleado;

    const [evaluaciones] = await db.execute(
      `SELECT
        ev.id_evaluacion,
        ev.fecha,
        ev.periodo,
        ev.puntaje_final,
        ev.semaforo,
        ia.analisis_generado
      FROM evaluaciones ev
      LEFT JOIN feedback_ia_evaluaciones ia
        ON ev.id_evaluacion = ia.id_evaluacion
      WHERE ev.id_empleado = ?
      ORDER BY ev.fecha DESC`,
      [idEmpleadoReal],
    );

    const [detallesEval] = await db.execute(
      `SELECT
        d.id_detalle,
        d.id_evaluacion,
        d.id_competencia,
        c.nombre AS competencia,
        c.tipo_skill,
        d.puntaje_obtenido,
        d.justificacion
       FROM detalle_eval d
       INNER JOIN competencias c ON d.id_competencia = c.id_competencia
       INNER JOIN evaluaciones ev ON d.id_evaluacion = ev.id_evaluacion
       WHERE ev.id_empleado = ?
       ORDER BY d.id_detalle ASC`,
      [idEmpleadoReal],
    );

    const detallesPorEvaluacion = new Map();
    for (const det of detallesEval) {
      const lista = detallesPorEvaluacion.get(det.id_evaluacion) || [];
      lista.push({
        id_detalle: det.id_detalle,
        id_competencia: det.id_competencia,
        competencia: det.competencia,
        tipo_skill: det.tipo_skill,
        puntaje_obtenido: Number(det.puntaje_obtenido),
        justificacion: det.justificacion,
      });
      detallesPorEvaluacion.set(det.id_evaluacion, lista);
    }

    const evaluacionesConDetalles = evaluaciones.map((ev) => ({
      ...ev,
      detalles: detallesPorEvaluacion.get(ev.id_evaluacion) || [],
    }));

    const [ultimoCheckin] = await db.execute(
      `SELECT
        nivel_motivacion,
        carga_trabajo,
        logros_semana,
        obstaculos,
        fecha
      FROM checkins_empleado
      WHERE id_empleado = ?
      ORDER BY id_checkin DESC
      LIMIT 1`,
      [idEmpleadoReal],
    );

    const [checkins] = await db.execute(
      `SELECT
        id_checkin,
        nivel_motivacion,
        carga_trabajo,
        logros_semana,
        obstaculos,
        link_evidencia,
        fecha
      FROM checkins_empleado
      WHERE id_empleado = ?
      ORDER BY fecha DESC`,
      [idEmpleadoReal],
    );

    const [metas] = await db.execute(
      `SELECT
        id_meta,
        titulo,
        descripcion,
        estado,
        progreso,
        fecha_limite,
        fecha_completada,
        comentarios_empleado
      FROM metas_empleado
      WHERE id_empleado = ?
      ORDER BY fecha_limite IS NULL, fecha_limite ASC, id_meta DESC`,
      [idEmpleadoReal],
    );

    const [planes] = await db.execute(
      `SELECT
        id_plan,
        id_evaluacion,
        objetivo,
        fecha_limite,
        estado_cumplimiento
      FROM planes_accion
      WHERE id_empleado = ?
      ORDER BY fecha_limite IS NULL, fecha_limite ASC, id_plan DESC`,
      [idEmpleadoReal],
    );

    return res.status(200).json({
      datos: empleadoFicha[0],
      evaluaciones: evaluacionesConDetalles,
      metas,
      planes,
      checkins,
      ultimoCheckin: ultimoCheckin[0] || null,
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);

    return res.status(500).json({
      mensaje: "Error al obtener el historial.",
    });
  }
};

// Registrar una nueva evaluación, guardar detalle_eval y generar planes automáticamente
const crearEvaluacion = async (req, res) => {
  const { id_empleado, periodo, puntaje_final, semaforo, detalles } = req.body;
  const id_evaluador = req.usuario.id;
  const fecha = new Date().toISOString().split("T")[0];

  try {
    // 1. Verificar que exista el empleado
    const [empCheck] = await db.execute(
      "SELECT id_empleado, id_usuario FROM empleados WHERE id_empleado = ?",
      [id_empleado],
    );

    if (empCheck.length === 0) {
      return res.status(404).json({
        mensaje:
          "No se encontró la ficha de empleado para asociar la evaluación.",
      });
    }

    const idEmpleadoReal = empCheck[0].id_empleado;
    const idUsuarioEmpleado = empCheck[0].id_usuario;

    // Validar y preparar detalles por competencia si vienen en el payload
    const detallesValidos = Array.isArray(detalles)
      ? detalles
          .filter(
            (item) =>
              item &&
              item.id_competencia &&
              item.puntaje_obtenido !== undefined &&
              item.puntaje_obtenido !== null &&
              !Number.isNaN(Number(item.puntaje_obtenido)),
          )
          .map((item) => ({
            id_competencia: Number(item.id_competencia),
            puntaje_obtenido: Number(item.puntaje_obtenido),
            justificacion: String(item.justificacion || "").trim(),
          }))
      : [];

    // Si no se envió puntaje_final pero sí detalles válidos, calcular promedio
    let puntajeCalculado = puntaje_final;
    if (
      (puntajeCalculado === undefined ||
        puntajeCalculado === null ||
        puntajeCalculado === "") &&
      detallesValidos.length > 0
    ) {
      const suma = detallesValidos.reduce(
        (acc, d) => acc + d.puntaje_obtenido,
        0,
      );
      puntajeCalculado = Number((suma / detallesValidos.length).toFixed(2));
    }

    // 2. Guardar la evaluación
    const [resultado] = await db.execute(
      `INSERT INTO evaluaciones
       (id_empleado, id_evaluador, fecha, periodo, puntaje_final, semaforo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        idEmpleadoReal,
        id_evaluador,
        fecha,
        periodo,
        puntajeCalculado,
        semaforo,
      ],
    );

    const idEvaluacionGenerada = resultado.insertId;

    // 2b. Guardar detalle por competencia en detalle_eval
    for (const det of detallesValidos) {
      await db.execute(
        `INSERT INTO detalle_eval
         (id_evaluacion, id_competencia, puntaje_obtenido, justificacion)
         VALUES (?, ?, ?, ?)`,
        [
          idEvaluacionGenerada,
          det.id_competencia,
          det.puntaje_obtenido,
          det.justificacion,
        ],
      );
    }

    // Notificar al empleado sobre la nueva evaluación
    try {
      await db.execute(
        `INSERT INTO notificaciones
         (id_usuario, titulo, mensaje, tipo)
         VALUES (?, ?, ?, ?)`,
        [
          idUsuarioEmpleado,
          "Nueva evaluación",
          `Se registró una nueva evaluación correspondiente al período ${periodo}. Ya podés consultar los resultados en SAPE.`,
          "evaluacion",
        ],
      );
    } catch (errorNotificacion) {
      console.error(
        "No se pudo crear la notificación de evaluación:",
        errorNotificacion,
      );
    }

    // Datos que se utilizarán para las dos funciones de IA
    let checkins = [];
    let feedbackGenerado = null;
    let nombreCompleto = "Colaborador";

    // 3. Generar feedback de evaluación
    try {
      const [checkinsRes] = await db.execute(
        `SELECT nivel_motivacion, carga_trabajo, logros_semana,
                obstaculos, fecha
         FROM checkins_empleado
         WHERE id_empleado = ?
         ORDER BY fecha DESC
         LIMIT 4`,
        [idEmpleadoReal],
      );

      checkins = checkinsRes;

      const [infoUsuario] = await db.execute(
        `SELECT u.nombre, u.apellido
         FROM empleados e
         JOIN usuarios u ON e.id_usuario = u.id
         WHERE e.id_empleado = ?`,
        [idEmpleadoReal],
      );

      if (infoUsuario.length > 0) {
        nombreCompleto = `${infoUsuario[0].nombre}${infoUsuario[0].apellido}`;
      }

      const evaluacionAdmin = {
        nombre_empleado: nombreCompleto,
        periodo,
        puntaje_final: puntajeCalculado,
        semaforo,
        competencias_evaluadas: detallesValidos,
      };

      feedbackGenerado = await iaService.generarFeedbackEvaluacion(
        evaluacionAdmin,
        checkins,
      );

      await db.execute(
        `INSERT INTO feedback_ia_evaluaciones
         (id_evaluacion, id_empleado, analisis_generado)
         VALUES (?, ?, ?)`,
        [idEvaluacionGenerada, idEmpleadoReal, feedbackGenerado],
      );
    } catch (errorIA) {
      console.error(
        "Advertencia: no se pudo generar el feedback de IA:",
        errorIA,
      );
    }

    // 4. Generar automáticamente los planes de acción
    let cantidadPlanes = 0;

    try {
      const evaluacionParaIA = {
        nombre_empleado: nombreCompleto,
        periodo,
        puntaje_final: puntajeCalculado,
        semaforo,
        fecha,
        competencias_evaluadas: detallesValidos,
      };

      const objetivos = await iaService.generarPlanesAccion(
        evaluacionParaIA,
        checkins,
        feedbackGenerado,
      );

      // 5. Guardar cada objetivo en las dos tablas
      for (const objetivo of objetivos) {
        // Calcular fecha límite
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() + objetivo.dias_plazo);

        const fechaLimiteSQL = [
          fechaLimite.getFullYear(),
          String(fechaLimite.getMonth() + 1).padStart(2, "0"),
          String(fechaLimite.getDate()).padStart(2, "0"),
        ].join("-");

        // Guardar el plan vinculado a la evaluación
        const objetivoCompleto = `${objetivo.titulo}:${objetivo.descripcion}`;

        await db.execute(
          `INSERT INTO planes_accion
           (id_empleado, id_evaluacion, objetivo, fecha_limite)
           VALUES (?, ?, ?, ?)`,
          [
            idEmpleadoReal,
            idEvaluacionGenerada,
            objetivoCompleto,
            fechaLimiteSQL,
          ],
        );

        // Crear también la meta que el empleado podrá seguir
        await db.execute(
          `INSERT INTO metas_empleado
           (id_empleado, id_evaluador, titulo, descripcion,
            estado, progreso, fecha_limite)
           VALUES (?, ?, ?, ?, 'Pendiente', 0, ?)`,
          [
            idEmpleadoReal,
            id_evaluador,
            objetivo.titulo,
            objetivo.descripcion,
            fechaLimiteSQL,
          ],
        );

        cantidadPlanes++;
      }
    } catch (errorPlanes) {
      console.error(
        "Advertencia: la evaluación se guardó, pero no se pudieron generar todos los planes:",
        errorPlanes,
      );
    }

    // 6. Notificar si se generaron planes de acción
    if (cantidadPlanes > 0) {
      try {
        await db.execute(
          `INSERT INTO notificaciones
           (id_usuario, titulo, mensaje, tipo)
           VALUES (?, ?, ?, ?)`,
          [
            idUsuarioEmpleado,
            "Nuevos planes de acción",
            `Se generaron ${cantidadPlanes} objetivos personalizados para ayudarte a mejorar tu desempeño. Ya podés consultarlos en la sección Mis metas.`,
            "meta",
          ],
        );
      } catch (errorNotificacion) {
        console.error(
          "No se pudo crear la notificación de planes:",
          errorNotificacion,
        );
      }
    }

    // 7. Responder al administrador
    return res.status(201).json({
      mensaje: "Evaluación registrada correctamente.",
      id_evaluacion: idEvaluacionGenerada,
      detalles_guardados: detallesValidos.length,
      feedback_generado: Boolean(feedbackGenerado),
      planes_generados: cantidadPlanes,
    });
  } catch (error) {
    console.error("Error al registrar la evaluación:", error);

    return res.status(500).json({
      mensaje: "Error al registrar la evaluación.",
    });
  }
};

// Eliminar una evaluación
const eliminarEvaluacion = async (req, res) => {
  const { id } = req.params;

  try {
    const [resultado] = await db.execute(
      "DELETE FROM evaluaciones WHERE id_evaluacion = ?",
      [id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Evaluación no encontrada." });
    }

    return res
      .status(200)
      .json({ mensaje: "Evaluación eliminada correctamente." });
  } catch (error) {
    console.error("Error al eliminar la evaluación:", error);
    return res
      .status(500)
      .json({ mensaje: "Error interno al eliminar la evaluación." });
  }
};

module.exports = {
  obtenerHistorialEmpleado,
  crearEvaluacion,
  eliminarEvaluacion,
};