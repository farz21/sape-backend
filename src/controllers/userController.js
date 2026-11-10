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
// Para GET /empleado/dashboard
const obtenerDashboard = async (req, res) => {
  const idUsuario = req.usuario.id; // Extraído del token

  try {
    const [usuario] = await db.execute(
      'SELECT e.id_empleado, u.nombre, u.apellido FROM usuarios u INNER JOIN empleados e ON u.id = e.id_usuario WHERE u.id = ?',
      [idUsuario]
    );

    if (usuario.length === 0) {
      return res.status(404).json({ mensaje: "Usuario sin legajo asignado." });
    }

    const idEmpleado = usuario[0].id_empleado;

    const [evaluaciones] = await db.execute(
      'SELECT id_evaluacion, fecha, periodo, puntaje_final, semaforo FROM evaluaciones WHERE id_empleado = ? ORDER BY fecha DESC',
      [idEmpleado]
    );

    // Simulamos la tabla de planes_accion si Tomás no la creó aún, o hacemos la consulta real
    const planes = [
      { id_plan: 1, objetivo: "Mejorar tiempos de entrega en sprints" },
      { id_plan: 2, objetivo: "Completar certificación de React" }
    ];

    res.status(200).json({
      empleado: usuario[0],
      evaluaciones,
      planes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al cargar el dashboard." });
  }
};
// Para GET /empleado/perfil
const obtenerMiPerfil = async (req, res) => {
  const idUsuario = req.usuario.id;

  try {
    const [perfil] = await db.execute(`
      SELECT u.nombre, u.apellido, u.email, u.empresa, e.legajo, e.fecha_ingreso, p.nombre as puesto, d.nombre as departamento 
      FROM usuarios u 
      INNER JOIN empleados e ON u.id = e.id_usuario
      LEFT JOIN puestos p ON e.id_puesto = p.id_puesto
      LEFT JOIN departamentos d ON p.id_departamento = d.id_departamento
      WHERE u.id = ?`,
      [idUsuario]
    );

    if (perfil.length === 0) {
      return res.status(404).json({ mensaje: "Perfil no encontrado." });
    }

    res.status(200).json(perfil[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al cargar el perfil." });
  }
};

module.exports = { obtenerEmpleados, obtenerDashboard, obtenerMiPerfil };