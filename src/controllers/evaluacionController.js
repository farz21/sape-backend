const db = require("../config/db");
const iaService = require("../services/iaService"); // Importamos el servicio de IA para generar feedback

// Obtener detalle de un empleado, sus evaluaciones y su último check-in
const obtenerHistorialEmpleado = async (req, res) => {
  const { id } = req.params; // Aquí llega el id_empleado

  try {
    // 1. Buscamos directamente por la tabla empleados y traemos los datos del usuario asociado
    const [empleadoFicha] = await db.execute(
      `SELECT 
        u.id as id_usuario, u.nombre, u.apellido, u.email, u.creado_en, u.empresa,
        e.id_empleado, e.legajo, e.fecha_ingreso, e.id_puesto
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

    // 2. Buscamos las evaluaciones asociadas a ese id_empleado
    const [evaluaciones] = await db.execute(
      `SELECT ev.id_evaluacion, ev.fecha, ev.periodo, ev.puntaje_final, ev.semaforo,
              ia.analisis_generado 
       FROM evaluaciones ev
       LEFT JOIN feedback_ia_evaluaciones ia ON ev.id_evaluacion = ia.id_evaluacion
       WHERE ev.id_empleado = ? 
       ORDER BY ev.fecha DESC`,
      [idEmpleadoReal],
    );

    // 3. Buscamos el último check-in registrado por el empleado (el más reciente)
    const [ultimoCheckin] = await db.execute(
      `SELECT nivel_motivacion, carga_trabajo, logros_semana, obstaculos, fecha 
       FROM checkins_empleado 
       WHERE id_empleado = ? 
       ORDER BY fecha DESC LIMIT 1`,
      [idEmpleadoReal],
    );

    // 4. Respondemos todo junto de manera limpia y sincronizada
    return res.status(200).json({
      datos: empleadoFicha[0],
      evaluaciones: evaluaciones,
      ultimoCheckin: ultimoCheckin[0] || null, // 👈 Ahora sí viaja el más reciente
    });

  } catch (error) {
    console.error("Error al obtener historial:", error);
    return res.status(500).json({ mensaje: "Error al obtener el historial." });
  }
};

// Registrar una nueva evaluación e inyectar Inteligencia Artificial
const crearEvaluacion = async (req, res) => {
  const { id_empleado, periodo, puntaje_final, semaforo } = req.body;
  const id_evaluador = req.usuario.id;
  const fecha = new Date().toISOString().split("T")[0];

  try {
    const [empCheck] = await db.execute(
      "SELECT id_empleado FROM empleados WHERE id_empleado = ?",
      [id_empleado],
    );

    if (empCheck.length === 0) {
      return res.status(404).json({
        mensaje: "No se encontró la ficha de empleado para asociar la evaluación.",
      });
    }
    const idEmpleadoReal = empCheck[0].id_empleado;

    const [resultado] = await db.execute(
      "INSERT INTO evaluaciones (id_empleado, id_evaluador, fecha, periodo, puntaje_final, semaforo) VALUES (?, ?, ?, ?, ?, ?)",
      [idEmpleadoReal, id_evaluador, fecha, periodo, puntaje_final, semaforo],
    );
    const idEvaluacionGenerada = resultado.insertId;

    // ==========================================
    // 🤖 BLOQUE DE INTELIGENCIA ARTIFICIAL
    // ==========================================
    try {
      const [checkins] = await db.execute(
        "SELECT nivel_motivacion, carga_trabajo, logros_semana, obstaculos, fecha FROM checkins_empleado WHERE id_empleado = ? ORDER BY fecha DESC LIMIT 4",
        [idEmpleadoReal],
      );

      const [infoUsuario] = await db.execute(
        `SELECT u.nombre, u.apellido 
         FROM empleados e 
         JOIN usuarios u ON e.id_usuario = u.id 
         WHERE e.id_empleado = ?`,
        [idEmpleadoReal],
      );

      const nombreCompleto =
        infoUsuario.length > 0
          ? `${infoUsuario[0].nombre} ${infoUsuario[0].apellido}`
          : "Colaborador";

      const evaluacionAdmin = {
        nombre_empleado: nombreCompleto,
        periodo,
        puntaje_final,
        semaforo,
      };

      const analisisGenerado = await iaService.generarFeedbackEvaluacion(
        evaluacionAdmin,
        checkins,
      );

      await db.execute(
        "INSERT INTO feedback_ia_evaluaciones (id_evaluacion, id_empleado, analisis_generado) VALUES (?, ?, ?)",
        [idEvaluacionGenerada, idEmpleadoReal, analisisGenerado],
      );
    } catch (errorIA) {
      console.error(
        "⚠ Advertencia: La evaluación se guardó, pero la IA falló:",
        errorIA,
      );
    }
    // ==========================================

    return res.status(201).json({
      mensaje: "Evaluación registrada con éxito y analizada por IA.",
      id_evaluacion: idEvaluacionGenerada,
    });
  } catch (error) {
    console.error("Error al registrar evaluación:", error);
    return res.status(500).json({ mensaje: "Error al registrar la evaluación." });
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

    return res.status(200).json({ mensaje: "Evaluación eliminada correctamente." });
  } catch (error) {
    console.error("Error al eliminar la evaluación:", error);
    return res.status(500).json({ mensaje: "Error interno al eliminar la evaluación." });
  }
};

module.exports = {
  obtenerHistorialEmpleado,
  crearEvaluacion,
  eliminarEvaluacion,
};