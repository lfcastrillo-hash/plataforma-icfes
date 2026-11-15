const jwt = require('jsonwebtoken');
const config = require('../config');
const { fail } = require('../lib/validation');
module.exports = async function verificarToken(req, res, next) {
 const token = req.cookies?.token_acceso || req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
 if (!token) return fail(res, 401, 'Inicia sesión para continuar.');
 let payload;
 try { payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], issuer: 'prepicfes', audience: 'prepicfes-web' }); }
 catch { return fail(res, 401, 'Sesión inválida o expirada.'); }
 if (!payload.jti || !Number.isInteger(payload.id_usuario)) return fail(res, 401, 'Sesión inválida.');
 try {
  const result = await req.app.locals.pool.query('SELECT u.id_usuario, u.email AS correo, u.rol FROM usuarios u JOIN sesiones s ON s.id_usuario = u.id_usuario WHERE u.id_usuario = $1 AND s.id_sesion = $2 AND s.expira > NOW()', [payload.id_usuario, payload.jti]);
  if (!result.rows.length) return fail(res, 401, 'Sesión cerrada o expirada.');
  if (req.get('X-Prep-User') && req.get('X-Prep-User') !== String(result.rows[0].id_usuario)) return fail(res, 403, 'La cuenta cambió. Recarga esta página.');
  req.usuario = result.rows[0]; req.sessionId = payload.jti;
  if(req.app.locals.accountLimiter)return req.app.locals.accountLimiter(req,res,next);
  next();
 } catch (error) { next(error); }
};
