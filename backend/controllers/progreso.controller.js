const v=require('../lib/validation');
const {readAreas}=require('./progresoAreas.controller');
const {general,saveArea}=require('../lib/progress');
const transaction=require('../lib/transaction');
async function obtenerProgreso(req,res){
 const {areas}=await readAreas(req);
 res.json({...Object.fromEntries(v.AREAS.map(a=>['progreso_'+a,areas[a]])),progreso_global:general(areas)});
}
async function guardarProgreso(req,res){
 if(!v.AREAS.every(a=>v.percentage(req.body[a])))return v.fail(res,400,'Los cinco porcentajes deben estar entre 0 y 100.');
 await transaction(req.app.locals.pool,async client=>{for(const a of v.AREAS)await saveArea(client,req.usuario,a,req.body[a]);});
 res.json({success:true,progresoGlobal:general((await readAreas(req)).areas)});
}
async function obtenerRanking(req,res){
 const result=await req.app.locals.pool.query('SELECT u.nombre, ROUND(SUM(p.progreso)/5) AS progreso_global FROM usuarios u JOIN progreso_areas p ON p.id_usuario=u.id_usuario WHERE EXISTS (SELECT 1 FROM inscripciones i JOIN clases c ON c.id_clase=i.id_clase WHERE i.id_usuario=u.id_usuario AND c.id_profesor=$1) GROUP BY u.id_usuario,u.nombre ORDER BY progreso_global DESC',[req.usuario.id_usuario]);
 res.json(result.rows);
}
module.exports={obtenerProgreso,guardarProgreso,obtenerRanking};
