const jwt = require("jsonwebtoken");
const SECRET_KEY = "icfes_secreto_123_ultra_seguro"; // Debe ser la misma clave del auth.controller

function verificarToken(req, res, next) {
  // 1. Intentamos leer la cookie que nos envía el navegador
  const token = req.cookies.token_acceso;

  // 2. Si no hay cookie, rechazamos la petición
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      mensaje: "Acceso denegado. No tienes autorización (Token faltante)." 
    });
  }

  try {
    // 3. Verificamos que la firma del token sea válida usando nuestra clave secreta
    const payloadDecodificado = jwt.verify(token, SECRET_KEY);
    
    // 4. Inyectamos los datos del usuario en el objeto 'req' para que los controladores los puedan usar
    req.usuario = payloadDecodificado; 
    
    // 5. Todo está bien, dejamos pasar la petición al controlador correspondiente
    next(); 
  } catch (error) {
    // Si el token fue modificado, expiró o es falso, entra aquí
    return res.status(403).json({ 
      success: false, 
      mensaje: "Token inválido o expirado. Por favor, inicia sesión de nuevo." 
    });
  }
}

module.exports = verificarToken;