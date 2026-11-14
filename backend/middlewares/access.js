const { fail, normalizeEmail } = require('../lib/validation');
const role = expected => (req, res, next) => req.usuario.rol === expected ? next() : fail(res, 403, 'No tienes permiso para esta operación.');
function ownEmail(req, res, next) {
  const supplied = req.params.correo || req.body?.correo;
  if (supplied && (typeof supplied !== 'string' || normalizeEmail(supplied) !== req.usuario.correo.toLowerCase())) return fail(res, 403, 'Solo puedes consultar o modificar tus datos.');
  next();
}
module.exports = { role, ownEmail };
