const db = require('../config/db');

// Obtener detalle de un empleado y sus evaluaciones
const obtenerHistorialEmpleado = async (req, res) => {
  const { id } = req.params; // Este id viene de la ruta y es el id_usuario del admin

  try {
    // 1. Buscamos al usuario y obtenemos su id_empleado real
    const [usuario] = await db.execute(
      `SELECT 
        u.id, 
        u.nombre, 
        u.apellido, 
        u.email, 
        u.creado_en, 
        u.empresa,
        e.id_empleado, 
        e.legajo, 
        e.fecha_ingreso,
        e.id_puesto
      FROM usuarios u
      LEFT JOIN empleados e ON u.id = e.id_usuario
      WHERE u.id = ? AND u.rol = "empleado"`, 
      [id]
    );

    if (usuario.length === 0 || !usuario[0].id_empleado) {
      return res.status(404).json({ mensaje: "Empleado no encontrado o sin ficha laboral asignada." });
    }

    const idEmpleadoReal = usuario[0].id_empleado;

    // 2. Buscamos las evaluaciones utilizando estrictamente el id_empleado real
    const [evaluaciones] = await db.execute(
      'SELECT id_evaluacion, fecha, periodo, puntaje_final, semaforo FROM evaluaciones WHERE id_empleado = ? ORDER BY fecha DESC',
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

// Registrar una nueva evaluación
const crearEvaluacion = async (req, res) => {
  const { id_empleado, periodo, puntaje_final, semaforo } = req.body;
  const id_evaluador = req.usuario.id; // Del token JWT del admin
  const fecha = new Date().toISOString().split('T')[0];

  try {
    // Nos aseguramos de resolver el id_empleado real por si el frontend mandó el id de usuario
    const [empCheck] = await db.execute(
      'SELECT id_empleado FROM empleados WHERE id_empleado = ? OR id_usuario = ?', 
      [id_empleado, id_empleado]
    );
    
    if (empCheck.length === 0) {
      return res.status(404).json({ mensaje: "No se encontró la ficha de empleado para asociar la evaluación." });
    }

    const idEmpleadoReal = empCheck[0].id_empleado;

    // Insertamos usando el id_empleado correcto y validado
    const [resultado] = await db.execute(
      'INSERT INTO evaluaciones (id_empleado, id_evaluador, fecha, periodo, puntaje_final, semaforo) VALUES (?, ?, ?, ?, ?, ?)',
      [idEmpleadoReal, id_evaluador, fecha, periodo, puntaje_final, semaforo]
    );

    res.status(201).json({ 
      mensaje: "Evaluación registrada con éxito",
      id_evaluacion: resultado.insertId 
    });
  } catch (error) {
    console.error("Error al registrar evaluación:", error);
    res.status(500).json({ mensaje: "Error al registrar la evaluación." });
  }
};

module.exports = { obtenerHistorialEmpleado, crearEvaluacion };