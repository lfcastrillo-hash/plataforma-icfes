// Límite por proceso. En varias instancias usar un almacén compartido.
module.exports = function rateLimit({ limit = 30, windowMs = 60000 } = {}) {
  const buckets = new Map();
  return (req, res, next) => {
    const now = Date.now();
    for (const [key, entry] of buckets) if (entry.until <= now) buckets.delete(key);
    const key = req.ip + req.path;
    const entry = buckets.get(key) || { count: 0, until: now + windowMs };
    buckets.set(key, entry);
    if (++entry.count > limit) {
      res.set('Retry-After', String(Math.ceil((entry.until - now) / 1000)));
      return res.status(429).json({ success: false, mensaje: 'Demasiadas solicitudes. Intenta en un minuto.' });
    }
    next();
  };
};
