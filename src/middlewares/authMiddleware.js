const jwt = require('jsonwebtoken');

const SECRET_KEY = "sape_super_secreto_123";

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(403).json({ mensaje: "Se requiere un token de acceso." });
  }

  const token = authHeader.split(" ")[1]; 

  // 🛠️ TRUCO TEMPORAL PARA EL MOCK LOGIN: Si es el token falso del admin, lo dejamos pasar
  if (token === "fake-jwt-token-123" || token === "fake-jwt-token-456") {
    req.usuario = { id: 1, rol: "administrador", email: "admin@sape.com" };
    return next();
  }

  try {
    const decodificado = jwt.verify(token, SECRET_KEY);
    req.usuario = decodificado; 
    next(); 
  } catch (error) {
    return res.status(401).json({ mensaje: "Token inválido o expirado." });
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