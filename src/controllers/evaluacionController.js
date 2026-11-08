const db = require('../config/db');

// Obtener detalle de un empleado y sus evaluaciones
const obtenerHistorialEmpleado = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Datos básicos del usuario
    const [usuario] = await db.execute(
      'SELECT id, nombre, apellido, email, empresa, creado_en FROM usuarios WHERE id = ? AND rol = "empleado"', 
      [id]
    );

    if (usuario.length === 0) {
      return res.status(404).json({ mensaje: "Empleado no encontrado" });
    }

    // 2. Evaluaciones asociadas
    const [evaluaciones] = await db.execute(
      'SELECT id_evaluacion, fecha, periodo, puntaje_final, semaforo FROM evaluaciones WHERE id_empleado = ? ORDER BY fecha DESC',
      [id]
    );

    res.status(200).json({
      datos: usuario[0],
      evaluaciones: evaluaciones
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener el historial." });
  }
};

// Registrar una nueva evaluación
const crearEvaluacion = async (req, res) => {
  const { id_empleado, periodo, puntaje_final, semaforo } = req.body;
  const id_evaluador = req.usuario.id; // Lo extraemos del token JWT gracias al middleware
  const fecha = new Date().toISOString().split('T')[0]; // Fecha actual YYYY-MM-DD

  try {
    const [resultado] = await db.execute(
      'INSERT INTO evaluaciones (id_empleado, id_evaluador, fecha, periodo, puntaje_final, semaforo) VALUES (?, ?, ?, ?, ?, ?)',
      [id_empleado, id_evaluador, fecha, periodo, puntaje_final, semaforo]
    );

    res.status(201).json({ 
      mensaje: "Evaluación registrada con éxito",
      id_evaluacion: resultado.insertId 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al registrar la evaluación." });
  }
};

module.exports = { obtenerHistorialEmpleado, crearEvaluacion };