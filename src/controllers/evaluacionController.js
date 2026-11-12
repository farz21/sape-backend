const db = require('../config/db');
const iaService = require('../services/iaService'); // Importamos el servicio de IA para generar feedback

// Obtener detalle de un empleado y sus evaluaciones
const obtenerHistorialEmpleado = async (req, res) => {
  const { id } = req.params; 

  try {
    // 1. Buscamos al usuario y obtenemos su id_empleado real
    const [usuario] = await db.execute(
      `SELECT 
        u.id, u.nombre, u.apellido, u.email, u.creado_en, u.empresa,
        e.id_empleado, e.legajo, e.fecha_ingreso, e.id_puesto
      FROM usuarios u
      LEFT JOIN empleados e ON u.id = e.id_usuario
      WHERE u.id = ? AND u.rol = "empleado"`, 
      [id]
    );

    if (usuario.length === 0 || !usuario[0].id_empleado) {
      return res.status(404).json({ mensaje: "Empleado no encontrado o sin ficha laboral asignada." });
    }

    const idEmpleadoReal = usuario[0].id_empleado;

    // 2. Buscamos las evaluaciones (incluyendo el feedback de la IA si existe)
    const [evaluaciones] = await db.execute(
      `SELECT ev.id_evaluacion, ev.fecha, ev.periodo, ev.puntaje_final, ev.semaforo,
              ia.analisis_generado 
       FROM evaluaciones ev
       LEFT JOIN feedback_ia_evaluaciones ia ON ev.id_evaluacion = ia.id_evaluacion
       WHERE ev.id_empleado = ? 
       ORDER BY ev.fecha DESC`,
      [idEmpleadoReal]
    );

    res.status(200).json({
      datos: usuario[0],
      evaluaciones: evaluaciones
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ mensaje: "Error al obtener el historial." });
  }
};

// Registrar una nueva evaluación e inyectar Inteligencia Artificial
const crearEvaluacion = async (req, res) => {
  const { id_empleado, periodo, puntaje_final, semaforo } = req.body;
  const id_evaluador = req.usuario.id; 
  const fecha = new Date().toISOString().split('T')[0];

  try {
    // 1. Validamos la ficha del empleado
    const [empCheck] = await db.execute(
      'SELECT id_empleado FROM empleados WHERE id_empleado = ? OR id_usuario = ?', 
      [id_empleado, id_empleado]
    );
    
    if (empCheck.length === 0) {
      return res.status(404).json({ mensaje: "No se encontró la ficha de empleado para asociar la evaluación." });
    }
    const idEmpleadoReal = empCheck[0].id_empleado;

    // 2. Insertamos la evaluación base en MySQL
    const [resultado] = await db.execute(
      'INSERT INTO evaluaciones (id_empleado, id_evaluador, fecha, periodo, puntaje_final, semaforo) VALUES (?, ?, ?, ?, ?, ?)',
      [idEmpleadoReal, id_evaluador, fecha, periodo, puntaje_final, semaforo]
    );
    const idEvaluacionGenerada = resultado.insertId;

    // ==========================================
    // 🤖 BLOQUE DE INTELIGENCIA ARTIFICIAL
    // ==========================================
    try {
      // A. Extraemos los últimos 4 check-ins del empleado (para simular el mes evaluado)
      const [checkins] = await db.execute(
        'SELECT nivel_motivacion, carga_trabajo, logros_semana, obstaculos, fecha FROM checkins_empleado WHERE id_empleado = ? ORDER BY fecha DESC LIMIT 4',
        [idEmpleadoReal]
      );

      // B. Estructuramos los datos del administrador para la IA
      const evaluacionAdmin = { periodo, puntaje_final, semaforo };

      // C. Llamamos a Gemini (se pausará un par de segundos aquí)
      const analisisGenerado = await iaService.generarFeedbackEvaluacion(evaluacionAdmin, checkins);

      // D. Guardamos el veredicto en la base de datos
      await db.execute(
        'INSERT INTO feedback_ia_evaluaciones (id_evaluacion, id_empleado, analisis_generado) VALUES (?, ?, ?)',
        [idEvaluacionGenerada, idEmpleadoReal, analisisGenerado]
      );
    } catch (errorIA) {
      console.error("⚠ Advertencia: La evaluación se guardó, pero la IA falló:", errorIA);
      // No lanzamos 'throw' para no romper el flujo principal.
    }
    // ==========================================

    res.status(201).json({ 
      mensaje: "Evaluación registrada con éxito y analizada por IA.",
      id_evaluacion: idEvaluacionGenerada 
    });
  } catch (error) {
    console.error("Error al registrar evaluación:", error);
    res.status(500).json({ mensaje: "Error al registrar la evaluación." });
  }
};

// Eliminar una evaluación
const eliminarEvaluacion = async (req, res) => {
  const { id } = req.params;

  try {
    const [resultado] = await db.execute(
      'DELETE FROM evaluaciones WHERE id_evaluacion = ?',
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Evaluación no encontrada." });
    }

    res.status(200).json({ mensaje: "Evaluación eliminada correctamente." });
  } catch (error) {
    console.error("Error al eliminar la evaluación:", error);
    res.status(500).json({ mensaje: "Error interno al eliminar la evaluación." });
  }
};

module.exports = { obtenerHistorialEmpleado, crearEvaluacion, eliminarEvaluacion };