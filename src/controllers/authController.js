const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); 

const SECRET_KEY = "sape_super_secreto_123";

const registro = async (req, res) => {
  const { nombre, apellido, email, empresa, password } = req.body;

  try {
    const [usuariosPrevios] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
    
    if (usuariosPrevios.length > 0) {
      return res.status(400).json({ mensaje: "El correo electrónico ya está registrado." });
    }

    const saltRounds = 10;
    const passwordHasheada = await bcrypt.hash(password, saltRounds);

    // 1. Insertar en la tabla usuarios
    const [result] = await db.execute(
      'INSERT INTO usuarios (nombre, apellido, email, empresa, password, rol) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, apellido, email, empresa, passwordHasheada, 'empleado']
    );

    const idUsuario = result.insertId;

    // 2. Insertar automáticamente en la tabla empleados (Nuevo bloque)
    try {
      const fechaActual = new Date().toISOString().split('T')[0]; 
      const legajoProvisorio = 'PROV-' + idUsuario; 

      await db.execute(
        "INSERT INTO empleados (id_usuario, legajo, fecha_ingreso, id_puesto) VALUES (?, ?, ?, ?)",
        [idUsuario, legajoProvisorio, fechaActual, 1] 
      );
    } catch (errorEmpleado) {
      // Si falla la tabla empleados, eliminamos el usuario recién creado
      await db.execute("DELETE FROM usuarios WHERE id = ?", [idUsuario]);
      console.error("Fallo al crear detalles de empleado en registro:", errorEmpleado);
      return res.status(500).json({ mensaje: "Error interno al generar el legajo." });
    }

    const userData = {
      id: idUsuario,
      nombre,
      apellido,
      email,
      empresa,
      rol: 'empleado'
    };

    const token = jwt.sign({ id: userData.id, rol: userData.rol }, SECRET_KEY, { expiresIn: '2h' });

    res.status(201).json({ user: userData, token });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [usuarios] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
    
    if (usuarios.length === 0) {
      return res.status(401).json({ mensaje: "Correo electrónico o contraseña incorrectos." });
    }

    const usuarioEncontrado = usuarios[0];

    const passwordValida = await bcrypt.compare(password, usuarioEncontrado.password);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: "Correo electrónico o contraseña incorrectos." });
    }

    const userData = {
      id: usuarioEncontrado.id,
      nombre: usuarioEncontrado.nombre,
      apellido: usuarioEncontrado.apellido,
      email: usuarioEncontrado.email,
      empresa: usuarioEncontrado.empresa,
      rol: usuarioEncontrado.rol
    };

    const token = jwt.sign({ id: userData.id, rol: userData.rol }, SECRET_KEY, { expiresIn: '2h' });

    res.status(200).json({ user: userData, token });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

module.exports = { registro, login };