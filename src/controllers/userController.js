
const db = require("../config/db");
const bcrypt = require("bcryptjs");

// ==========================================
// OBTENER LISTA COMPLETA DE EMPLEADOS
// ==========================================
const obtenerEmpleados = async (req, res) => {
  try {
    const [empleados] = await db.execute(
      `SELECT 
        e.id_empleado,
        u.id AS id_usuario,
        u.nombre,
        u.apellido,
        u.email,
        u.creado_en,
        u.empresa,
        e.legajo,
        e.fecha_ingreso,
        e.id_puesto
      FROM usuarios u
      INNER JOIN empleados e ON u.id = e.id_usuario
      WHERE u.rol = 'empleado'`
    );

    res.status(200).json(empleados);

  } catch (error) {
    console.error("Error al obtener empleados:", error);

    res.status(500).json({
      mensaje: "Error al obtener empleados"
    });
  }
};
// ==========================================
// OBTENER ESTADÍSTICAS DEL DASHBOARD ADMIN
// ==========================================
const obtenerEstadisticas = async (req, res) => {
  try {
    // 1. Total de empleados (solo con rol 'empleado')
    const [empleadosRes] = await db.execute(
      "SELECT COUNT(*) AS total FROM usuarios u INNER JOIN empleados e ON u.id = e.id_usuario WHERE u.rol = 'empleado'"
    );
    const totalEmpleados = empleadosRes[0].total; // Extraemos solo el número

    // 2. Distribución de resultados (Semáforos)
    const [distribucionSemaforo] = await db.execute(`
      SELECT semaforo as name, COUNT(*) as value 
      FROM evaluaciones 
      GROUP BY semaforo
    `);

    // 3. Promedio de puntajes
    const [promedioRes] = await db.execute(
      "SELECT AVG(puntaje_final) as promedio FROM evaluaciones"
    );

    const promedioPuntaje = promedioRes[0].promedio
      ? parseFloat(promedioRes[0].promedio).toFixed(2)
      : "0.00";

    // Enviamos un objeto limpio al frontend
    res.status(200).json({
      totalEmpleados,
      distribucionSemaforo,
      promedioPuntaje
    });

  } catch (error) {
    console.error("Error al cargar estadísticas:", error);
    res.status(500).json({
      mensaje: "Error al obtener estadísticas del dashboard."
    });
  }
};

// ==========================================
// CREAR UN NUEVO EMPLEADO (ALTA)
// ==========================================
// ==========================================
// CREAR UN NUEVO EMPLEADO (ALTA)
// ==========================================
const crearEmpleado = async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    password,
    empresa,
    legajo,
    fecha_ingreso,
    id_puesto
  } = req.body;

  // Validar campos obligatorios que vienen del formulario
  if (!nombre || !apellido || !email || !password || !legajo || !fecha_ingreso) {
    return res.status(400).json({ mensaje: "Faltan campos obligatorios por completar." });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1. Insertar en usuarios
    const [resultUser] = await db.execute(
      'INSERT INTO usuarios (nombre, apellido, email, password, empresa, rol) VALUES (?, ?, ?, ?, ?, "empleado")',
      [nombre, apellido, email, hashedPassword, empresa || "S.A.P.E."]
    );

    const idUsuario = resultUser.insertId;

    // 2. Insertar en empleados ASEGURANDO guardar el id_usuario
    try {
      await db.execute(
        "INSERT INTO empleados (id_usuario, legajo, fecha_ingreso, id_puesto) VALUES (?, ?, ?, ?)",
        [idUsuario, legajo, fecha_ingreso, id_puesto || 1]
      );
    } catch (errorEmpleado) {
      // Si falla la tabla empleados, borramos el usuario creado para mantener la consistencia
      await db.execute("DELETE FROM usuarios WHERE id = ?", [idUsuario]);
      
      // Imprimimos el error real de MySQL en la consola para depurar fácil
      console.error("Error técnico detallado en empleados:", errorEmpleado.message);
      
      return res.status(400).json({ 
        mensaje: "Fallo al insertar en la tabla empleados. Verifica que el Puesto seleccionado exista o que el Legajo no esté repetido." 
      });
    }

    res.status(201).json({ mensaje: "Empleado creado exitosamente." });
  } catch (error) {
    console.error("Error al crear usuario base:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ mensaje: "Ese correo electrónico ya está registrado." });
    }
    res.status(500).json({ mensaje: "Error interno al crear el empleado." });
  }
};

// ==========================================
// ACTUALIZAR UN EMPLEADO (MODIFICACIÓN)
// ==========================================
const actualizarEmpleado = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, email, legajo, fecha_ingreso } = req.body;

  try {
    await db.execute(
      "UPDATE usuarios SET nombre = ?, apellido = ?, email = ? WHERE id = ?",
      [nombre, apellido, email, id]
    );

    await db.execute(
      "UPDATE empleados SET legajo = ?, fecha_ingreso = ? WHERE id_usuario = ?",
      [legajo, fecha_ingreso, id]
    );

    res.status(200).json({
      mensaje: "Empleado actualizado correctamente."
    });

  } catch (error) {
    console.error("Error al actualizar empleado:", error);
    res.status(500).json({
      mensaje: "Error al actualizar los datos."
    });
  }
};

// ==========================================
// ELIMINAR UN EMPLEADO (BAJA)
// ==========================================
const eliminarEmpleado = async (req, res) => {
  const { id } = req.params;

  try {
    // Eliminar evaluaciones relacionadas
    await db.execute(
      "DELETE FROM evaluaciones WHERE id_empleado = (SELECT id_empleado FROM empleados WHERE id_usuario = ?)",
      [id]
    );

    // Eliminar empleado
    await db.execute(
      "DELETE FROM empleados WHERE id_usuario = ?",
      [id]
    );

    // Eliminar usuario
    await db.execute(
      "DELETE FROM usuarios WHERE id = ?",
      [id]
    );

    res.status(200).json({
      mensaje: "Empleado eliminado del sistema."
    });

  } catch (error) {
    console.error("Error al eliminar empleado:", error);
    res.status(500).json({
      mensaje: "Error al intentar eliminar el registro."
    });
  }
};

// ==========================================
// OBTENER DASHBOARD DEL EMPLEADO
// ==========================================
const obtenerDashboard = async (req, res) => {
  const idUsuario = req.usuario.id; // ID del token (tabla usuarios)

  try {
    // 1. Buscamos al empleado asociado a este usuario
    const [empleadoRes] = await db.execute(
      `SELECT e.id_empleado, u.nombre, u.apellido, u.email, u.empresa, e.legajo, e.fecha_ingreso
       FROM usuarios u
       INNER JOIN empleados e ON u.id = e.id_usuario
       WHERE u.id = ?`,
      [idUsuario]
    );

    if (empleadoRes.length === 0) {
      return res.status(404).json({
        mensaje: "Usuario sin legajo asignado en la base de datos."
      });
    }

    const empleado = empleadoRes[0];
    const idEmpleadoReal = empleado.id_empleado; // El ID real para buscar evaluaciones

    // 2. Buscamos las evaluaciones utilizando estrictamente el id_empleado
    const [evaluaciones] = await db.execute(
      `SELECT id_evaluacion, fecha, periodo, puntaje_final, semaforo
       FROM evaluaciones
       WHERE id_empleado = ?
       ORDER BY fecha ASC`,
      [idEmpleadoReal]
    );

    const planes = [
      { id_plan: 1, objetivo: "Mejorar tiempos de entrega en sprints" },
      { id_plan: 2, objetivo: "Completar certificación de React" }
    ];

    res.status(200).json({
      empleado: empleado,
      evaluaciones: evaluaciones,
      planes: planes
    });

  } catch (error) {
    console.error("Error al cargar el dashboard del empleado:", error);
    res.status(500).json({ mensaje: "Error al cargar el dashboard." });
  }
};

// ==========================================
// OBTENER PERFIL DEL EMPLEADO
// ==========================================
const obtenerMiPerfil = async (req, res) => {
  const idUsuario = req.usuario.id;

  try {
    const [perfil] = await db.execute(
      `SELECT 
        u.nombre,
        u.apellido,
        u.email,
        u.empresa,
        e.legajo,
        e.fecha_ingreso,
        p.nombre as puesto,
        d.nombre as departamento
      FROM usuarios u
      INNER JOIN empleados e ON u.id = e.id_usuario
      LEFT JOIN puestos p ON e.id_puesto = p.id_puesto
      LEFT JOIN departamentos d ON p.id_departamento = d.id_departamento
      WHERE u.id = ?`,
      [idUsuario]
    );

    if (perfil.length === 0) {
      return res.status(404).json({
        mensaje: "Perfil no encontrado."
      });
    }

    res.status(200).json(perfil[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al cargar el perfil."
    });
  }
};

// ==========================================
// EXPORTAR CONTROLADORES
// ==========================================
module.exports = {
  obtenerEmpleados,
  obtenerEstadisticas,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado,
  obtenerDashboard,
  obtenerMiPerfil
};
