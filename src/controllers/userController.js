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
  const idUsuario = req.usuario.id; // ID que viene del token JWT (tabla usuarios)

  try {
    // 1. Buscamos el registro en la tabla empleados usando el id_usuario
    const [empleadoRes] = await db.execute(
      `SELECT e.id_empleado, u.nombre, u.apellido, u.email, u.empresa, e.legajo, e.fecha_ingreso
       FROM usuarios u
       INNER JOIN empleados e ON u.id = e.id_usuario
       WHERE u.id = ?`,
      [idUsuario]
    );

    if (empleadoRes.length === 0) {
      return res.status(404).json({
        mensaje: "Usuario sin legajo asignado."
      });
    }

    const empleado = empleadoRes[0];
    const idEmpleado = empleado.id_empleado; // ¡Este es el ID que usa la tabla evaluaciones!

    // 2. Buscamos las evaluaciones usando el id_empleado correcto
    const [evaluaciones] = await db.execute(
      `SELECT id_evaluacion, fecha, periodo, puntaje_final, semaforo
       FROM evaluaciones
       WHERE id_empleado = ?
       ORDER BY fecha DESC`,
      [idEmpleado]
    );

    // Planes de acción (puedes dejarlos estáticos o traerlos de una tabla si la creaste)
    const planes = [
      {
        id_plan: 1,
        objetivo: "Mejorar tiempos de entrega en sprints"
      },
      {
        id_plan: 2,
        objetivo: "Completar certificación de React"
      }
    ];

    // Enviamos el objeto con la estructura que espera tu frontend
    res.status(200).json({
      empleado: empleado,
      evaluaciones: evaluaciones,
      planes: planes
    });

  } catch (error) {
    console.error("Error al cargar el dashboard del empleado:", error);
    res.status(500).json({
      mensaje: "Error al cargar el dashboard."
    });
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