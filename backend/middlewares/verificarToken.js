const jwt = require("jsonwebtoken");
const SECRET_KEY = "icfes_secreto_123_ultra_seguro";

function verificarToken(req, res, next) {
  // 1. Intentar leer desde cookie
  let token = req.cookies.token_acceso;

  // 2. Si no hay cookie, intentar desde el header Authorization: Bearer <token>
  if (!token) {
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  // 3. Si no hay token por ningún lado, rechazar
  if (!token) {
    return res.status(401).json({
      success: false,
      mensaje: "Acceso denegado. No tienes autorización (Token faltante).",
    });
  }

  try {
    const payloadDecodificado = jwt.verify(token, SECRET_KEY);
    req.usuario = payloadDecodificado;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      mensaje: "Token inválido o expirado. Por favor, inicia sesión de nuevo.",
    });
  }
}

module.exports = verificarToken;
