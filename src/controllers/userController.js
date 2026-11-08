const db = require('../config/db'); // Tu conexión a MySQL

const obtenerEmpleados = async (req, res) => {
  try {
    // Traemos los datos de la tabla usuarios donde el rol sea 'empleado'
    // Excluimos la contraseña por seguridad
    const [empleados] = await db.execute(
      'SELECT id, nombre, apellido, email, empresa, rol, creado_en FROM usuarios WHERE rol = "empleado"'
    );
    
    res.status(200).json(empleados);
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    res.status(500).json({ mensaje: "Error interno al cargar la lista de empleados." });
  }
};

module.exports = { obtenerEmpleados };