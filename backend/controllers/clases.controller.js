const { randomBytes }=require('node:crypto');
const v=require('../lib/validation');
const transaction=require('../lib/transaction');
async function ownClass(req,res,client=req.app.locals.pool){
 const id=req.params.id || req.params.id_clase || req.body.id_clase;
 if(!v.id(id)){v.fail(res,400,'Identificador de clase inválido.');return null;}
 const result=await client.query('SELECT id_clase FROM clases WHERE id_clase=$1 AND id_profesor=$2 FOR UPDATE',[id,req.usuario.id_usuario]);
 if(!result.rows.length){v.fail(res,404,'Clase no encontrada.');return null;}
 return Number(id);
}
async function obtenerClases(req,res){
 const result=await req.app.locals.pool.query('SELECT id_clase,nombre_clase,codigo_acceso,anuncio FROM clases WHERE id_profesor=$1 ORDER BY id_clase',[req.usuario.id_usuario]);
 res.json({success:true,clases:result.rows});
}
async function crearClase(req,res){
 if(!v.text(req.body.nombre_clase,1,120))return v.fail(res,400,'El nombre debe tener entre 1 y 120 caracteres.');
 const result=await req.app.locals.pool.query("INSERT INTO clases(nombre_clase,id_profesor,codigo_acceso,anuncio) VALUES($1,$2,$3,'') RETURNING *",[req.body.nombre_clase.trim(),req.usuario.id_usuario,randomBytes(6).toString('hex').toUpperCase()]);
 res.status(201).json({success:true,clase:result.rows[0]});
}
async function eliminarClase(req,res){
 const done=await transaction(req.app.locals.pool,async client=>{
  const id=await ownClass(req,res,client);if(!id)return;
  await client.query('DELETE FROM inscripciones WHERE id_clase=$1',[id]);
  await client.query('DELETE FROM clases WHERE id_clase=$1 AND id_profesor=$2',[id,req.usuario.id_usuario]);
  return true;
 });
 if(done)res.json({success:true,mensaje:'Clase eliminada correctamente.'});
}
async function actualizarAnuncio(req,res){
 if(!v.text(req.body.anuncio,0,5000))return v.fail(res,400,'El anuncio admite hasta 5000 caracteres.');
 const done=await transaction(req.app.locals.pool,async client=>{
  const id=await ownClass(req,res,client);if(!id)return;
  await client.query('UPDATE clases SET anuncio=$1 WHERE id_clase=$2 AND id_profesor=$3',[req.body.anuncio,id,req.usuario.id_usuario]);
  return true;
 });
 if(done)res.json({success:true,mensaje:'Anuncio publicado con éxito.'});
}
async function obtenerEstudiantesDeClase(req,res){
 const id=await ownClass(req,res);if(!id)return;
 const result=await req.app.locals.pool.query('SELECT u.nombre,u.email AS correo,COALESCE(ROUND(SUM(pa.progreso)/5),0) AS puntaje FROM inscripciones i JOIN usuarios u ON u.id_usuario=i.id_usuario LEFT JOIN progreso_areas pa ON pa.id_usuario=u.id_usuario WHERE i.id_clase=$1 GROUP BY u.id_usuario,u.nombre,u.email ORDER BY puntaje DESC',[id]);
 res.json({success:true,estudiantes:result.rows});
}
async function buscarEstudiante(req,res){
 if(!v.text(req.query.q,3,254))return v.fail(res,400,'La búsqueda admite entre 3 y 254 caracteres.');
 const term=req.query.q.trim().toLowerCase();
 const pattern='%'+term.replace(/[\\%_]/g,c=>'\\'+c)+'%';
 const result=await req.app.locals.pool.query(`SELECT u.id_usuario,u.nombre,u.email FROM usuarios u WHERE u.rol='estudiante'
   AND (lower(u.email)=$1 OR (u.email ILIKE $2 AND EXISTS (
     SELECT 1 FROM inscripciones i JOIN clases c ON c.id_clase=i.id_clase
     WHERE i.id_usuario=u.id_usuario AND c.id_profesor=$3))) ORDER BY u.email LIMIT 1`,[term,pattern,req.usuario.id_usuario]);
 const estudiante=result.rows[0];if(!estudiante)return res.json({success:true,student:null});
 const clases=await req.app.locals.pool.query('SELECT c.nombre_clase FROM inscripciones i JOIN clases c ON c.id_clase=i.id_clase WHERE i.id_usuario=$1 AND c.id_profesor=$2',[estudiante.id_usuario,req.usuario.id_usuario]);
 res.json({success:true,student:{nombre:estudiante.nombre,correo:estudiante.email,clases:clases.rows.map(c=>c.nombre_clase)}});
}
async function inscription(req,res,remove){
 if(!v.email(req.body.email))return v.fail(res,400,'Correo inválido.');
 const done=await transaction(req.app.locals.pool,async client=>{
  const id=await ownClass(req,res,client);if(!id)return;
  const found=await client.query("SELECT id_usuario FROM usuarios WHERE lower(email)=$1 AND rol='estudiante'",[v.normalizeEmail(req.body.email)]);
  if(!found.rows.length){v.fail(res,404,'Estudiante no encontrado.');return false;}
  const uid=found.rows[0].id_usuario;
  if(remove)await client.query('DELETE FROM inscripciones WHERE id_usuario=$1 AND id_clase=$2',[uid,id]);
  else {
   const result=await client.query('INSERT INTO inscripciones(id_usuario,id_clase) VALUES($1,$2) ON CONFLICT(id_usuario,id_clase) DO NOTHING RETURNING id_usuario',[uid,id]);
   if(!result.rows.length){v.fail(res,409,'El estudiante ya pertenece a este grupo.');return false;}
  }
  return true;
 });
 if(done)res.json({success:true,mensaje:remove?'Estudiante retirado.':'Estudiante agregado con éxito.'});
}
async function obtenerClasesDeEstudiante(req,res){
 const result=await req.app.locals.pool.query('SELECT c.id_clase,c.nombre_clase,c.anuncio,u.nombre AS nombre_profesor FROM inscripciones i JOIN clases c ON c.id_clase=i.id_clase JOIN usuarios u ON u.id_usuario=c.id_profesor WHERE i.id_usuario=$1 ORDER BY c.id_clase',[req.usuario.id_usuario]);
 res.json({success:true,clases:result.rows,anuncios:result.rows.filter(c=>c.anuncio?.trim())});
}
module.exports={crearClase,eliminarClase,obtenerClases,actualizarAnuncio,obtenerEstudiantesDeClase,buscarEstudiante,obtenerClasesDeEstudiante,agregarEstudianteAClase:(req,res)=>inscription(req,res,false),removerEstudianteDeClase:(req,res)=>inscription(req,res,true)};
