const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const { fixture }=require('../fixtures/app.cjs');
const { database }=require('../fixtures/database.cjs');
const { createApp }=require('../../backend/server');
const transaction=require('../../backend/lib/transaction');
test('M1-LEGACY conversión en login solo con compatibilidad explícita; no modifica clave incorrecta',async()=>{
 const config=require('../../backend/config'),previous=config.legacyPasswords;
 const f=await fixture();config.legacyPasswords=true;
 try{
  await f.pool.query("INSERT INTO usuarios(nombre,email,password,rol) VALUES('Legacy QA','legacy@example.test','old-fixture','estudiante')");
  assert.equal((await f.login('legacy@example.test','estudiante','incorrecta')).status,401);
  assert.equal((await f.pool.query('SELECT password FROM usuarios')).rows[0].password,'old-fixture');
  assert.equal((await f.login('legacy@example.test','estudiante','old-fixture')).status,200);
  assert.ok((await f.pool.query('SELECT password FROM usuarios')).rows[0].password.startsWith('scrypt$'));
 }finally{config.legacyPasswords=previous;await f.close();}
});
test('INT-ASC repositorio PostgreSQL → transacción → rollback real',async()=>{
 const pool=await database();try{
  await assert.rejects(transaction(pool,async c=>{
   await c.query("INSERT INTO usuarios(nombre,email,password,rol) VALUES('QA','rollback@example.test','ficticio','estudiante')");
   await c.query('INSERT INTO inscripciones(id_usuario,id_clase) VALUES(9999,9999)');
  }));
  assert.equal((await pool.query('SELECT * FROM usuarios')).rows.length,0);
 }finally{await pool.end();}
});
test('INT-ASC migración repetible y persistencia en disco después de reiniciar',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'prepicfes-pg-test-'));
 let f=await fixture({directory});
 try{
  await f.register('restart@example.test');const cookie=(await f.login('restart@example.test')).cookie;
  await f.request('/progreso-area',{method:'POST',cookie,body:{area:'ingles',progreso:100}});
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a23cAAAAASUVORK5CYII=','base64');
  const form=new FormData();form.append('foto',new Blob([png],{type:'image/png'}),'restart.png');
  const foto=(await f.request('/perfil/actualizar',{method:'POST',cookie,body:form})).data.foto;
  await f.close();f=null;
  f=await fixture({directory});const fresh=(await f.login('restart@example.test')).cookie;
  assert.equal((await f.request('/progreso-general/restart@example.test',{cookie:fresh})).data.progreso,20);
  assert.deepEqual(Buffer.from(await (await fetch(f.base+foto)).arrayBuffer()),png);
 }finally{
  await f?.close();
  // Únicamente el directorio temporal creado por esta prueba, resuelto y comprobado.
  const resolved=path.resolve(directory),base=path.resolve(os.tmpdir())+path.sep;
  if(!resolved.startsWith(base)||!path.basename(resolved).startsWith('prepicfes-pg-test-'))throw new Error('Directorio de pruebas no válido');
  await fs.rm(resolved,{recursive:true,force:true});
 }
});
test('INT-DESC API → controlador IA con proveedor stub (no llamada real)',async()=>{
 const oldKey=process.env.OPENROUTER_API_KEY,oldModel=process.env.OPENROUTER_MODEL;
 process.env.OPENROUTER_API_KEY='test-placeholder';process.env.OPENROUTER_MODEL='test-model';
 const aiClient={chat:{completions:{create:async()=>({choices:[{message:{content:'Respuesta de prueba del stub'}}]})}}};
 const f=await fixture({aiClient});
 try{
  await f.register('ai@example.test');const cookie=(await f.login('ai@example.test')).cookie;
  const result=await f.request('/chat',{method:'POST',cookie,body:{mensaje:'Funciones'}});assert.equal(result.status,200);assert.equal(result.data.respuesta,'Respuesta de prueba del stub');
  aiClient.chat.completions.create=async()=>{throw {status:429,message:'secret-never-return'};};
  const failure=await f.request('/chat',{method:'POST',cookie,body:{mensaje:'Funciones'}});assert.equal(failure.status,503);assert.ok(!JSON.stringify(failure.data).includes('secret-never-return'));
  aiClient.chat.completions.create=async()=>({choices:[]});assert.equal((await f.request('/chat',{method:'POST',cookie,body:{mensaje:'Funciones'}})).status,502);
 }finally{await f.close();if(oldKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=oldKey;if(oldModel===undefined)delete process.env.OPENROUTER_MODEL;else process.env.OPENROUTER_MODEL=oldModel;}
});
test('SEC límite de intentos y recuperación de fallo de BD sin exponer SQL',async()=>{
 const f=await fixture({rateLimitOptions:{limit:2}});
 try{
  for(let i=0;i<2;i++)assert.equal((await f.request('/login',{method:'POST',body:{}})).status,400);
  assert.equal((await f.request('/login',{method:'POST',body:{}})).status,429);
 }finally{await f.close();}
 const app=createApp({pool:{query:async()=>{throw new Error('private-connection-string');}}});
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 try{
  const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/health');assert.equal(response.status,503);assert.ok(!(await response.text()).includes('private-connection-string'));
 }finally{await new Promise(resolve=>server.close(resolve));}
});
