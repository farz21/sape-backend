const db = require("../config/db");
const bcrypt = require("bcryptjs");

// Obtener lista completa de empleados
const obtenerEmpleados = async (req, res) => {
  try {
    // Usamos INNER JOIN para traer los datos de la cuenta (usuarios)
    // junto con los datos laborales (empleados)
    const [empleados] = await db.execute(`
      SELECT 
        u.id, 
        u.nombre, 
        u.apellido, 
        u.email, 
        u.empresa, 
        u.creado_en,
        e.id_empleado,
        e.legajo,
        e.fecha_ingreso
      FROM usuarios u
      INNER JOIN empleados e ON u.id = e.id_usuario
      WHERE u.rol = "empleado"
    `);

    res.status(200).json(empleados);
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    res
      .status(500)
      .json({ mensaje: "Error interno al cargar la lista de empleados." });
  }
};
// Para GET /empleado/dashboard
const obtenerDashboard = async (req, res) => {
  const idUsuario = req.usuario.id; // Extraído del token


// Obtener estadísticas para el Dashboard del Admin
const obtenerEstadisticas = async (req, res) => {
  try {
    // 1. Total de empleados registrados en la tabla laboral
    const [empleadosRes] = await db.execute(
      "SELECT COUNT(*) as total FROM empleados",
    );
    const totalEmpleados = empleadosRes[0].total;

    // 2. Distribución de resultados (Semáforos)
    const [distribucionSemaforo] = await db.execute(`
      SELECT semaforo as name, COUNT(*) as value 
      FROM evaluaciones 
      GROUP BY semaforo
    `);

    // 3. Promedio de puntajes
    const [promedioRes] = await db.execute(
      "SELECT AVG(puntaje_final) as promedio FROM evaluaciones",
    );
    const promedioPuntaje = promedioRes[0].promedio
      ? parseFloat(promedioRes[0].promedio).toFixed(2)
      : 0;

    res.status(200).json({
      totalEmpleados,
      distribucionSemaforo,
      promedioPuntaje,
    });
  } catch (error) {
    console.error("Error al cargar estadísticas:", error);
    res
      .status(500)
      .json({ mensaje: "Error al obtener estadísticas del dashboard." });
  }
};
// Crear un nuevo empleado (Alta)
const crearEmpleado = async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    password,
    empresa,
    legajo,
    fecha_ingreso,
    id_puesto,
  } = req.body;

  try {
    // Requisito de la cátedra: Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1. Insertar en la tabla cuentas (usuarios)
    const [resultUser] = await db.execute(
      'INSERT INTO usuarios (nombre, apellido, email, password, empresa, rol) VALUES (?, ?, ?, ?, ?, "empleado")',
      [nombre, apellido, email, hashedPassword, empresa || "S.A.P.E."],
    );

    const idUsuario = resultUser.insertId;

    // 2. Insertar en la tabla laboral (empleados)
    // Nota: Usamos id_puesto = 1 por defecto si no viene en el formulario
    await db.execute(
      "INSERT INTO empleados (id_usuario, legajo, fecha_ingreso, id_puesto) VALUES (?, ?, ?, ?)",
      [idUsuario, legajo, fecha_ingreso, id_puesto || 1],
    );

    res.status(201).json({ mensaje: "Empleado creado exitosamente." });
  } catch (error) {
    console.error("Error al crear empleado:", error);
    res.status(500).json({ mensaje: "Error al crear el empleado." });
  }
};
// Actualizar un empleado (Modificación)
const actualizarEmpleado = async (req, res) => {
  const { id } = req.params; // ID del usuario
  const { nombre, apellido, email, legajo, fecha_ingreso } = req.body;

  try {
    await db.execute(
      "UPDATE usuarios SET nombre = ?, apellido = ?, email = ? WHERE id = ?",
      [nombre, apellido, email, id],
    );

    await db.execute(
      "UPDATE empleados SET legajo = ?, fecha_ingreso = ? WHERE id_usuario = ?",
      [legajo, fecha_ingreso, id],
    );

    res.status(200).json({ mensaje: "Empleado actualizado correctamente." });
  } catch (error) {
    console.error("Error al actualizar empleado:", error);
    res.status(500).json({ mensaje: "Error al actualizar los datos." });
  }
};

// Eliminar un empleado (Baja)
const eliminarEmpleado = async (req, res) => {
  const { id } = req.params; // ID del usuario

  try {
    // Al eliminar el usuario, si la base de datos tiene ON DELETE CASCADE en la foreign key,
    // se borra el legajo automáticamente. Si no, borramos en orden inverso:
    await db.execute(
      "DELETE FROM evaluaciones WHERE id_empleado = (SELECT id_empleado FROM empleados WHERE id_usuario = ?)",
      [id],
    );
    await db.execute("DELETE FROM empleados WHERE id_usuario = ?", [id]);
    await db.execute("DELETE FROM usuarios WHERE id = ?", [id]);

    res.status(200).json({ mensaje: "Empleado eliminado del sistema." });
  } catch (error) {
    console.error("Error al eliminar empleado:", error);
    res
      .status(500)
      .json({ mensaje: "Error al intentar eliminar el registro." });
  }
};


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

module.exports = {
  obtenerEmpleados,
  obtenerEstadisticas,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado,
  obtenerDashboard,
  obtenerMiPerfil
};

