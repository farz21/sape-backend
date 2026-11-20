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
        u.avatar_url,
        u.creado_en,
        u.empresa,
        e.legajo,
        e.fecha_ingreso,
        e.id_puesto,
        p.nombre AS nombre_puesto,
        p.seniority,
        p.id_departamento,
        d.nombre AS nombre_departamento,
        e.en_periodo_prueba
      FROM usuarios u
      INNER JOIN empleados e ON u.id = e.id_usuario
      LEFT JOIN puestos p ON e.id_puesto = p.id_puesto
      LEFT JOIN departamentos d ON p.id_departamento = d.id_departamento
      WHERE u.rol = 'empleado'`,
    );

    res.status(200).json(empleados);
  } catch (error) {
    console.error("Error al obtener empleados:", error);

    res.status(500).json({
      mensaje: "Error al obtener empleados",
    });
  }
};

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
    id_puesto,
    condicion_laboral,
    en_periodo_prueba,
  } = req.body;

  // Validar campos obligatorios que vienen del formulario
  if (
    !nombre ||
    !apellido ||
    !email ||
    !password ||
    !legajo ||
    !fecha_ingreso
  ) {
    return res
      .status(400)
      .json({ mensaje: "Faltan campos obligatorios por completar." });
  }

  const esPrueba =
    condicion_laboral === "a_prueba" ||
    condicion_laboral === true ||
    condicion_laboral === 1 ||
    condicion_laboral === "1" ||
    en_periodo_prueba === true ||
    en_periodo_prueba === 1 ||
    en_periodo_prueba === "1"
      ? 1
      : 0;

  const emailLimpio = String(email).trim().toLowerCase();

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1. Insertar en usuarios
    const [resultUser] = await db.execute(
      'INSERT INTO usuarios (nombre, apellido, email, password, empresa, rol) VALUES (?, ?, ?, ?, ?, "empleado")',
      [nombre.trim(), apellido.trim(), emailLimpio, hashedPassword, empresa || "S.A.P.E."],
    );

    const idUsuario = resultUser.insertId;

    // 2. Insertar en empleados ASEGURANDO guardar el id_usuario
    try {
      await db.execute(
        "INSERT INTO empleados (id_usuario, legajo, fecha_ingreso, id_puesto, en_periodo_prueba) VALUES (?, ?, ?, ?, ?)",
        [idUsuario, legajo.trim(), fecha_ingreso, Number(id_puesto) || 1, esPrueba],
      );
    } catch (errorEmpleado) {
      // Si falla la tabla empleados, borramos el usuario creado para mantener la consistencia
      await db.execute("DELETE FROM usuarios WHERE id = ?", [idUsuario]);

      console.error(
        "Error técnico detallado en empleados:",
        errorEmpleado.message,
      );

      return res.status(400).json({
        mensaje:
          "Fallo al insertar en la tabla empleados. Verifica que el Puesto seleccionado exista o que el Legajo no esté repetido.",
      });
    }

    res.status(201).json({ mensaje: "Empleado creado exitosamente." });
  } catch (error) {
    console.error("Error al crear usuario base:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ mensaje: "Ese correo electrónico ya está registrado." });
    }
    res.status(500).json({ mensaje: "Error interno al crear el empleado." });
  }
};

// ==========================================
// ACTUALIZAR UN EMPLEADO (MODIFICACIÓN)
// ==========================================
const actualizarEmpleado = async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    apellido,
    email,
    legajo,
    fecha_ingreso,
    id_puesto,
    condicion_laboral,
    en_periodo_prueba,
  } = req.body;

  const esPrueba =
    condicion_laboral === "a_prueba" ||
    condicion_laboral === true ||
    condicion_laboral === 1 ||
    condicion_laboral === "1" ||
    en_periodo_prueba === true ||
    en_periodo_prueba === 1 ||
    en_periodo_prueba === "1"
      ? 1
      : 0;

  try {
    // Priorizamos id_empleado (parámetro de ruta en /admin/empleados/editar/:id)
    let [filasEmp] = await db.execute(
      "SELECT id_empleado, id_usuario, id_puesto FROM empleados WHERE id_empleado = ? LIMIT 1",
      [id],
    );

    if (filasEmp.length === 0) {
      [filasEmp] = await db.execute(
        "SELECT id_empleado, id_usuario, id_puesto FROM empleados WHERE id_usuario = ? LIMIT 1",
        [id],
      );
    }

    if (filasEmp.length === 0) {
      return res.status(404).json({ mensaje: "Empleado no encontrado." });
    }

    const idEmpleadoReal = filasEmp[0].id_empleado;
    const idUsuario = filasEmp[0].id_usuario;
    const puestoFinal = id_puesto ? Number(id_puesto) : filasEmp[0].id_puesto || 1;
    const emailLimpio = String(email || "").trim().toLowerCase();

    await db.execute(
      "UPDATE usuarios SET nombre = ?, apellido = ?, email = ? WHERE id = ?",
      [String(nombre || "").trim(), String(apellido || "").trim(), emailLimpio, idUsuario],
    );

    await db.execute(
      "UPDATE empleados SET legajo = ?, fecha_ingreso = ?, id_puesto = ?, en_periodo_prueba = ? WHERE id_empleado = ?",
      [String(legajo || "").trim(), fecha_ingreso, puestoFinal, esPrueba, idEmpleadoReal],
    );

    return res.status(200).json({
      mensaje: "Empleado actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error al actualizar empleado:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        mensaje: "Ese correo electrónico ya está en uso por otro usuario.",
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        mensaje: "El puesto seleccionado no existe en el sistema.",
      });
    }

    return res.status(500).json({
      mensaje: "Error al actualizar los datos.",
    });
  }
};

// ==========================================
// ELIMINAR UN EMPLEADO (BAJA)
// ==========================================
const eliminarEmpleado = async (req, res) => {
  const { id } = req.params;

  try {
    let [filasEmp] = await db.execute(
      "SELECT id_empleado, id_usuario FROM empleados WHERE id_empleado = ? LIMIT 1",
      [id],
    );

    if (filasEmp.length === 0) {
      [filasEmp] = await db.execute(
        "SELECT id_empleado, id_usuario FROM empleados WHERE id_usuario = ? LIMIT 1",
        [id],
      );
    }

    if (filasEmp.length === 0) {
      return res.status(404).json({ mensaje: "Empleado no encontrado." });
    }

    const idEmpleadoReal = filasEmp[0].id_empleado;
    const idUsuario = filasEmp[0].id_usuario;

    await db.execute("DELETE FROM evaluaciones WHERE id_empleado = ?", [
      idEmpleadoReal,
    ]);

    await db.execute("DELETE FROM empleados WHERE id_empleado = ?", [
      idEmpleadoReal,
    ]);

    await db.execute("DELETE FROM usuarios WHERE id = ?", [idUsuario]);

    res.status(200).json({
      mensaje: "Empleado eliminado del sistema.",
    });
  } catch (error) {
    console.error("Error al eliminar empleado:", error);
    res.status(500).json({
      mensaje: "Error al intentar eliminar el registro.",
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
      `SELECT e.id_empleado, u.nombre, u.apellido, u.email, u.empresa, e.legajo, e.fecha_ingreso, e.en_periodo_prueba
       FROM usuarios u
       INNER JOIN empleados e ON u.id = e.id_usuario
       WHERE u.id = ?`,
      [idUsuario],
    );

    if (empleadoRes.length === 0) {
      return res.status(404).json({
        mensaje: "Usuario sin legajo asignado en la base de datos.",
      });
    }

    const empleado = empleadoRes[0];
    const idEmpleadoReal = empleado.id_empleado; // El ID real para buscar evaluaciones

    // 2. Buscamos las evaluaciones INCLUYENDO el feedback de la IA
    const [evaluaciones] = await db.execute(
      `SELECT ev.id_evaluacion, ev.fecha, ev.periodo, ev.puntaje_final, ev.semaforo, ia.analisis_generado
       FROM evaluaciones ev
       LEFT JOIN feedback_ia_evaluaciones ia ON ev.id_evaluacion = ia.id_evaluacion
       WHERE ev.id_empleado = ?
       ORDER BY ev.fecha DESC`,
      [idEmpleadoReal],
    );

    const [planes] = await db.execute(
      `SELECT id_plan, objetivo, fecha_limite, estado_cumplimiento
   FROM planes_accion
   WHERE id_empleado = ?
   ORDER BY id_plan DESC`,
      [idEmpleadoReal],
    );

    res.status(200).json({
      empleado: empleado,
      evaluaciones: evaluaciones,
      planes: planes,
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
        u.avatar_url,
        e.legajo,
        e.fecha_ingreso,
        e.en_periodo_prueba,
        p.nombre as puesto,
        d.nombre as departamento
      FROM usuarios u
      INNER JOIN empleados e ON u.id = e.id_usuario
      LEFT JOIN puestos p ON e.id_puesto = p.id_puesto
      LEFT JOIN departamentos d ON p.id_departamento = d.id_departamento
      WHERE u.id = ?`,
      [idUsuario],
    );

    if (perfil.length === 0) {
      return res.status(404).json({
        mensaje: "Perfil no encontrado.",
      });
    }

    res.status(200).json(perfil[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al cargar el perfil.",
    });
  }
};

// Actualizar la URL de la foto del empleado autenticado
const actualizarAvatar = async (req, res) => {
  const { avatar_url } = req.body;
  if (typeof avatar_url !== "string" || avatar_url.length > 500) {
    return res.status(400).json({ mensaje: "La URL no puede superar 500 caracteres." });
  }

  let avatarUrlLimpia = avatar_url.trim();
  if (avatarUrlLimpia) {
    try {
      const url = new URL(avatarUrlLimpia);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("Protocolo invalido");
    } catch {
      return res.status(400).json({ mensaje: "Ingresá una URL valida que comience con http o https." });
    }
  }

  try {
    await db.execute("UPDATE usuarios SET avatar_url = ? WHERE id = ?", [avatarUrlLimpia || null, req.usuario.id]);
    return res.status(200).json({ mensaje: "Foto de perfil actualizada.", avatar_url: avatarUrlLimpia || null });
  } catch (error) {
    console.error("Error al actualizar el avatar:", error);
    return res.status(500).json({ mensaje: "No se pudo actualizar la foto de perfil." });
  }
};

// ==========================================
// CAMBIAR CONTRASEÑA DEL EMPLEADO
// ==========================================
const cambiarPassword = async (req, res) => {
  const idUsuario = req.usuario.id; // Obtenido del token JWT
  const { passwordActual, nuevaPassword } = req.body;

  if (!passwordActual || !nuevaPassword) {
    return res
      .status(400)
      .json({ mensaje: "Todos los campos son obligatorios." });
  }

  try {
    // 1. Buscamos el usuario actual en la base de datos
    const [usuarios] = await db.execute(
      "SELECT password FROM usuarios WHERE id = ?",
      [idUsuario],
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    const usuario = usuarios[0];

    // 2. Verificamos que la contraseña actual coincida con el hash
    const esPasswordValida = await bcrypt.compare(
      passwordActual,
      usuario.password,
    );
    if (!esPasswordValida) {
      return res
        .status(400)
        .json({ mensaje: "La contraseña actual es incorrecta." });
    }

    // 3. Hasheamos la nueva contraseña (con un salt de 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nuevaPassword, salt);

    // 4. Actualizamos en la tabla usuarios
    await db.execute("UPDATE usuarios SET password = ? WHERE id = ?", [
      hashedPassword,
      idUsuario,
    ]);

    res.status(200).json({ mensaje: "Contraseña actualizada exitosamente." });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res
      .status(500)
      .json({ mensaje: "Error interno al cambiar la contraseña." });
  }
};

// ==========================================
// EXPORTAR CONTROLADORES
// ==========================================
module.exports = {
  obtenerEmpleados,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado,
  obtenerDashboard,
  obtenerMiPerfil,
  actualizarAvatar,
  cambiarPassword,
};