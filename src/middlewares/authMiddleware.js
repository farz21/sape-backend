const jwt = require('jsonwebtoken');

// 1. Usar variable de entorno para mayor seguridad (con fallback)
const SECRET_KEY = process.env.JWT_SECRET || "sape_super_secreto_123";

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ mensaje: "Acceso denegado. Se requiere un token de acceso válido (Bearer)." });
  }

  const token = authHeader.split(" ")[1]; 

  try {
    // 2. Verificación real del token
    const decodificado = jwt.verify(token, SECRET_KEY);
    req.usuario = decodificado; 
    next(); 
  } catch (error) {
    return res.status(401).json({ mensaje: "Token inválido o expirado. Por favor, inicie sesión nuevamente." });
  }
};

const evaluarRolAdmin = (req, res, next) => {
  if (req.usuario && req.usuario.rol === 'administrador') {
    next();
  } else {
    return res.status(403).json({ mensaje: "Acceso denegado. Se requiere rol de Administrador." });
  }
};

module.exports = {
  verificarToken,
  evaluarRolAdmin
};