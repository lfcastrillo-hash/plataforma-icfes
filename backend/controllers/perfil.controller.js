const {randomUUID}=require('node:crypto');
const v=require('../lib/validation');
const {hashPassword}=require('../lib/passwords');
const transaction=require('../lib/transaction');
async function obtenerPerfil(req,res){
 const result=await req.app.locals.pool.query('SELECT id_usuario,nombre,email,rol,foto_perfil,biografia FROM usuarios WHERE id_usuario=$1',[req.usuario.id_usuario]);
 if(!result.rows.length)return v.fail(res,404,'Usuario no encontrado.');
 const usuario=result.rows[0];
 if(usuario.rol==='profesor')usuario.lista_clases=(await req.app.locals.pool.query('SELECT nombre_clase FROM clases WHERE id_profesor=$1 ORDER BY id_clase',[usuario.id_usuario])).rows.map(c=>c.nombre_clase);
 res.json(usuario);
}
const {imageType,validateImage}=require('../lib/images');
async function actualizarPerfil(req,res){
 const {nombre,nuevo_correo,biografia,password}=req.body;
 if((nombre!==undefined&&!v.text(nombre,1,120)) || (nuevo_correo!==undefined&&!v.email(nuevo_correo)) || (biografia!==undefined&&!v.text(biografia,0,2000)) || (password!==undefined&&password!==''&&!v.password(password)))return v.fail(res,400,'Datos de perfil inválidos: nombre 1?120, biografía 0?2000 y contraseña 8?128.');
 try {
  const image=await validateImage(req.file);
  const updated=await transaction(req.app.locals.pool,async client=>{
   const result=await client.query('SELECT nombre,email,biografia,foto_perfil FROM usuarios WHERE id_usuario=$1 FOR UPDATE',[req.usuario.id_usuario]);
   if(!result.rows.length)return null;
   const old=result.rows[0];
   const name=nombre===undefined?old.nombre:nombre.trim();const email=nuevo_correo===undefined?old.email:v.normalizeEmail(nuevo_correo);
   const bio=biografia===undefined?old.biografia:biografia;
   const filename=req.file?randomUUID():null;const foto=filename?'/uploads/'+filename:old.foto_perfil;
   await client.query('UPDATE usuarios SET nombre=$1,email=$2,biografia=$3,foto_perfil=$4 WHERE id_usuario=$5',[name,email,bio,foto,req.usuario.id_usuario]);
   if(req.file)await client.query('UPDATE usuarios SET foto_datos=$1,foto_tipo=$2,foto_nombre=$3 WHERE id_usuario=$4',[image.buffer,image.type,filename,req.usuario.id_usuario]);
   if(password){
    await client.query('UPDATE usuarios SET password=$1 WHERE id_usuario=$2',[await hashPassword(password),req.usuario.id_usuario]);
    await client.query('DELETE FROM sesiones WHERE id_usuario=$1 AND id_sesion<>$2',[req.usuario.id_usuario,req.sessionId]);
   }
   // Mantener las columnas de compatibilidad por correo sin perder relaciones por ID.
   await client.query('UPDATE progreso_areas SET correo=$1 WHERE id_usuario=$2',[email,req.usuario.id_usuario]);
   await client.query('UPDATE progreso_estudiante SET correo=$1 WHERE id_usuario=$2',[email,req.usuario.id_usuario]);
   return {success:true,mensaje:'¡Perfil actualizado con éxito!',nombre:name,correo:email,biografia:bio,foto};
  });
  if(!updated)return v.fail(res,404,'Usuario no encontrado.');
  res.json(updated);
 }catch(error){if(error.status)return v.fail(res,error.status,error.message);if(error.code==='23505')return v.fail(res,409,'Ese correo ya está registrado por otro usuario.');throw error;}
}
async function obtenerFoto(req,res,next){
 const result=await req.app.locals.pool.query('SELECT foto_datos,foto_tipo FROM usuarios WHERE foto_nombre=$1',[req.params.nombre]);
 if(!result.rows.length)return next();
 res.set('Content-Type',result.rows[0].foto_tipo).set('Cache-Control','private, max-age=3600').send(Buffer.from(result.rows[0].foto_datos));
}
module.exports={obtenerPerfil,actualizarPerfil,obtenerFoto,imageType};
