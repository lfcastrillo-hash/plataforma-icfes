const v=require('../lib/validation');
const {readAreas}=require('./progresoAreas.controller');
const {general}=require('../lib/progress');
async function obtenerProgreso(req,res){
 const {areas}=await readAreas(req);
 res.json({...Object.fromEntries(v.AREAS.map(a=>['progreso_'+a,areas[a]])),progreso_global:general(areas)});
}
async function guardarProgreso(req,res){
 return v.fail(res,410,'La escritura directa de porcentajes fue retirada. Envía respuestas a /api/progreso-area.');
}
async function obtenerRanking(req,res){
 const result=await req.app.locals.pool.query('SELECT u.nombre, ROUND(SUM(p.progreso)/5) AS progreso_global FROM usuarios u JOIN progreso_areas p ON p.id_usuario=u.id_usuario WHERE EXISTS (SELECT 1 FROM inscripciones i JOIN clases c ON c.id_clase=i.id_clase WHERE i.id_usuario=u.id_usuario AND c.id_profesor=$1) GROUP BY u.id_usuario,u.nombre ORDER BY progreso_global DESC',[req.usuario.id_usuario]);
 res.json(result.rows);
}
module.exports={obtenerProgreso,guardarProgreso,obtenerRanking};
