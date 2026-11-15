// Límite por proceso. En varias instancias usar un almacén compartido.
module.exports = function rateLimit({ limit = 30, windowMs = 60000, maxKeys = 10000, key = req => req.ip, skipSuccessfulRequests = false, now = Date.now } = {}) {
  const buckets = new Map();
  return (req, res, next) => {
    const time = now();
    for (const [id, entry] of buckets) if (entry.until <= time) buckets.delete(id);
    const id = key(req);
    const entry = buckets.get(id) || { count: 0, until: time + windowMs };
    if(!buckets.has(id)&&buckets.size>=maxKeys){res.set('Retry-After',String(Math.ceil(windowMs/1000)));return res.status(429).json({success:false,mensaje:'Demasiadas solicitudes. Intenta más tarde.'});}
    buckets.set(id, entry);
    if (++entry.count > limit) {
      res.set('Retry-After', String(Math.max(1,Math.ceil((entry.until - time) / 1000))));
      return res.status(429).json({ success: false, mensaje: 'Demasiadas solicitudes. Intenta en un minuto.' });
    }
    if(skipSuccessfulRequests)res.once('finish',()=>{if(res.statusCode<400)entry.count=Math.max(0,entry.count-1);});
    next();
  };
};
