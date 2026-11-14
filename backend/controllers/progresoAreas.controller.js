const v = require('../lib/validation');
const { validateState, progressFromState, general, saveArea } = require('../lib/progress');
const transaction = require('../lib/transaction');
async function guardarProgresoArea(req, res) {
 const { area, progreso, estado } = req.body;
 if (!v.AREAS.includes(area) || !v.percentage(progreso) || (estado !== undefined && !validateState(estado))) return v.fail(res,400,'Área, progreso o estado inválidos.');
 await transaction(req.app.locals.pool, client => saveArea(client,req.usuario,area,estado ? progressFromState(estado) : progreso,estado));
 res.json({success:true});
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
