const jwt = require('jsonwebtoken');

const SECRET_KEY = "sape_super_secreto_123";

const verificarToken = (req, res, next) => {
  // El frontend enviará el token en los headers como: "Bearer eyJhbGci..."
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(403).json({ mensaje: "Se requiere un token de acceso." });
  }

  try {
    const token = authHeader.split(" ")[1]; 
    const decodificado = jwt.verify(token, SECRET_KEY);
    
    // Guardamos los datos decodificados en la request para que el controlador pueda usarlos
    req.usuario = decodificado; 
    
    // Todo está bien, pasamos al siguiente paso (el controlador)
    next(); 
  } catch (error) {
    return res.status(401).json({ mensaje: "Token inválido o expirado." });
  }
};

module.exports = verificarToken;