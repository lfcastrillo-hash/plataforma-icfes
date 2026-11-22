const v = require('../lib/validation');
const { general, applyAction } = require('../lib/progress');
const {evaluateAnswer,topicKeys}=require('../lib/catalogo-aprendizaje');
const transaction = require('../lib/transaction');
async function guardarProgresoArea(req, res) {
 const {area,respuesta,completarTema}=req.body;
 if(!v.AREAS.includes(area) || Object.keys(req.body).some(k=>!['area','respuesta','completarTema','correo'].includes(k))
   || (Object.hasOwn(req.body,'respuesta')===Object.hasOwn(req.body,'completarTema'))){return v.fail(res,400,'Envía una respuesta o una solicitud de completar tema, nunca porcentajes ni aciertos.');}
 const answer=respuesta===undefined?null:evaluateAnswer(area,respuesta);
 if((respuesta!==undefined&&!answer)||(completarTema!==undefined&&topicKeys(area,completarTema).length!==8)){return v.fail(res,400,'Ejercicio, opción o tema inválidos.');}
 try{
  const result=await transaction(req.app.locals.pool,client=>applyAction(client,req.usuario,area,{answer,...(completarTema!==undefined?{complete:completarTema}:{})}));
  res.json(result);
 }catch(error){if(error.status===409){return v.fail(res,409,error.message);}throw error;}
}
async function readAreas(req) {
 const result = await req.app.locals.pool.query('SELECT area,progreso,estado FROM progreso_areas WHERE id_usuario=$1',[req.usuario.id_usuario]);
 const areas=Object.fromEntries(v.AREAS.map(a=>[a,0])), estados={};
 for (const row of result.rows) if(v.AREAS.includes(row.area)){areas[row.area]=Number(row.progreso);estados[row.area]=row.estado;}
 return {areas,estados};
}
async function obtenerProgresoAreas(req,res) { res.json({success:true,...await readAreas(req)}); }
async function obtenerProgresoGeneral(req,res) {
 const progreso=general((await readAreas(req)).areas);
 res.json({success:true,progreso,simulacro1:progreso>=50,simulacro2:progreso>=75,simulacro3:progreso>=100});
}
module.exports={guardarProgresoArea,obtenerProgresoGeneral,obtenerProgresoAreas,readAreas};
