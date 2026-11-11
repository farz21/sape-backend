const db = require('../config/db');

const crearCheckin = async (req, res) => {
  const id_usuario = req.usuario.id; // El ID del usuario que viene en el token
  const { nivel_motivacion, carga_trabajo, logros_semana, obstaculos } = req.body;
  const fecha = new Date().toISOString().split('T')[0];

  try {
    // 1. Verificamos si este usuario tiene un perfil en la tabla 'empleados'
    const [empleados] = await db.execute(
      'SELECT id_empleado FROM empleados WHERE id_usuario = ?', 
      [id_usuario]
    );

    if (empleados.length === 0) {
      return res.status(403).json({ 
        mensaje: "Acceso denegado. Tu usuario no tiene un perfil de empleado asociado." 
      });
    }

    const id_empleado = empleados[0].id_empleado;

    // 2. Si es un empleado válido, guardamos el check-in
    const [resultado] = await db.execute(
      `INSERT INTO checkins_empleado 
      (id_empleado, fecha, nivel_motivacion, carga_trabajo, logros_semana, obstaculos) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [id_empleado, fecha, nivel_motivacion, carga_trabajo, logros_semana, obstaculos]
    );

    res.status(201).json({ 
      mensaje: "Check-in guardado exitosamente.",
      id_checkin: resultado.insertId 
    });
  } catch (error) {
    console.error("Error al crear check-in:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

const obtenerMisCheckins = async (req, res) => {
  const id_usuario = req.usuario.id;

  try {
    const [empleados] = await db.execute('SELECT id_empleado FROM empleados WHERE id_usuario = ?', [id_usuario]);
    
    if (empleados.length === 0) {
      return res.status(403).json({ mensaje: "No tienes un perfil de empleado." });
    }

    const id_empleado = empleados[0].id_empleado;

    const [checkins] = await db.execute(
      'SELECT * FROM checkins_empleado WHERE id_empleado = ? ORDER BY fecha DESC',
      [id_empleado]
    );
    res.status(200).json(checkins);
  } catch (error) {
    console.error("Error al obtener check-ins:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

module.exports = { crearCheckin, obtenerMisCheckins };