const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const { fixture }=require('../fixtures/app.cjs');
const {answer}=require('../fixtures/aprendizaje.cjs');
const { database }=require(process.env.QA_DATABASE_ENGINE==='postgres'?'../fixtures/native-database.cjs':'../fixtures/database.cjs');
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
  await f.request('/progreso-area',{method:'POST',cookie,body:answer('ingles')});
  const png=await require('../fixtures/images.cjs').png();
  const form=new FormData();form.append('foto',new Blob([png],{type:'image/png'}),'restart.png');
  const foto=(await f.request('/perfil/actualizar',{method:'POST',cookie,body:form})).data.foto;
  await f.close();f=null;
  f=await fixture({directory});const fresh=(await f.login('restart@example.test')).cookie;
  assert.equal((await f.request('/progreso-general/restart@example.test',{cookie:fresh})).data.progreso,1);
  assert.deepEqual(Buffer.from(await (await fetch(f.base+foto)).arrayBuffer()),png);
 }finally{
  await f?.close();
  // Únicamente el directorio temporal creado por esta prueba, resuelto y comprobado.
  const resolved=path.resolve(directory),base=path.resolve(os.tmpdir())+path.sep;
  if(!resolved.startsWith(base)||!path.basename(resolved).startsWith('prepicfes-pg-test-'))throw new Error('Directorio de pruebas no válido');
  await fs.rm(resolved,{recursive:true,force:true});
 }
});
test('SCOPE IA retirada: /chat responde 410 sin proveedor ni credenciales',async()=>{
 const f=await fixture();try{
  for(const body of [{},{mensaje:'Funciones'}]){
   const r=await f.request('/chat',{method:'POST',body});assert.equal(r.status,410);assert.match(r.data.mensaje,/excluido/);
  }
  assert.equal(require('../../backend/package.json').dependencies.openai,undefined);
 }finally{await f.close();}
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
test('SEC archivos históricos HTML no se sirven; imágenes conservan compatibilidad',async()=>{
 const crypto=require('node:crypto');const directory=path.resolve('backend/uploads');
 await fs.mkdir(directory,{recursive:true});const key='qa-'+crypto.randomUUID();
 const html=path.join(directory,key+'.html'),png=path.join(directory,key+'.png');
 await fs.writeFile(html,'<script>alert(1)</script>',{flag:'wx'});await fs.writeFile(png,Buffer.from([137,80,78,71]),{flag:'wx'});
 const f=await fixture();try{
  assert.equal((await fetch(f.base+'/uploads/'+key+'.html')).status,404);
  const response=await fetch(f.base+'/uploads/'+key+'.png');assert.equal(response.status,200);
  assert.match(response.headers.get('content-security-policy'),/sandbox/);
 }finally{await f.close();await fs.unlink(html);await fs.unlink(png);}
});
