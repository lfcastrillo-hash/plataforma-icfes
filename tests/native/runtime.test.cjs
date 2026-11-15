const {test}=require('node:test'),assert=require('node:assert/strict'),{fork}=require('node:child_process');
const {database}=require('../fixtures/native-database.cjs'),{poolFor,settings}=require('../../scripts/db/native-context.cjs');
const {fixture}=require('../fixtures/app.cjs');
const {answer}=require('../fixtures/aprendizaje.cjs');
const {png}=require('../fixtures/images.cjs');
test('PG-N04 privilegios mínimos: app no crea/altera/trunca tablas ni lee tablas no autorizadas',async()=>{
 const db=await database(),other=await database({empty:true});try{
  await other.query('CREATE TABLE reservado(id integer)');
  const role=(await db.query('SELECT rolsuper,rolcreatedb,rolcreaterole,rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0];assert.deepEqual(role,{rolsuper:false,rolcreatedb:false,rolcreaterole:false,rolbypassrls:false});
  for(const sql of ['CREATE TABLE no_permitida(id integer)','ALTER TABLE usuarios ADD COLUMN no_permitida integer','TRUNCATE usuarios','DELETE FROM usuarios','UPDATE resultados_simulacro SET modalidad=modalidad','SELECT * FROM '+other.schema+'.reservado'])await assert.rejects(db.query(sql),e=>e.code==='42501');
  const admin=poolFor('migrator',db.schema);try{const r=(await admin.query('SELECT rolsuper,rolcreatedb,rolcreaterole,rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0];assert.ok(Object.values(r).every(v=>v===false));}finally{await admin.end();}
 }finally{await db.end();await other.close();}
});
test('PG-N05 dos conexiones reales: bloqueo de fila y rollback liberan al segundo escritor',async()=>{
 const db=await database();const a=await db.connect(),b=await db.connect();
 try{
  const pids=await Promise.all([a.query('SELECT pg_backend_pid() AS pid'),b.query('SELECT pg_backend_pid() AS pid')]);assert.notEqual(pids[0].rows[0].pid,pids[1].rows[0].pid);
  await db.query("INSERT INTO usuarios(nombre,email,password,rol) VALUES('QA','concurrent@example.test','fixture','estudiante')");
  await a.query('BEGIN');await a.query("UPDATE usuarios SET nombre='No persistir' WHERE email='concurrent@example.test'");
  let done=false;const pending=b.query("UPDATE usuarios SET nombre='Segundo escritor' WHERE email='concurrent@example.test' RETURNING nombre").then(r=>{done=true;return r;});
  const observer=poolFor('migrator',db.schema);try{
   let blocked=false;for(let i=0;i<40;i++){const r=await observer.query('SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1',[pids[1].rows[0].pid]);if(r.rows[0]?.wait_event_type==='Lock'){blocked=true;break;}await new Promise(resolve=>setTimeout(resolve,25));}
   // El rol sin pg_read_all_stats puede ver wait_event solo de su propio rol: usar pg_locks.
   if(!blocked){const r=await observer.query('SELECT count(*) FROM pg_locks WHERE pid=$1 AND NOT granted',[pids[1].rows[0].pid]);blocked=Number(r.rows[0].count)>0;}
   assert.equal(blocked,true);assert.equal(done,false);
  }finally{await observer.end();}
  await a.query('ROLLBACK');assert.equal((await pending).rows[0].nombre,'Segundo escritor');
  assert.equal((await db.query('SELECT nombre FROM usuarios')).rows[0].nombre,'Segundo escritor');
 }finally{await a.query('ROLLBACK');a.release();b.release();await db.end();}
});
test('PG-N06 progreso concurrente no pierde respuestas ni duplica crédito',async()=>{
 const f=await fixture();try{
  await f.register('parallel@example.test');const cookie=(await f.login('parallel@example.test')).cookie;
  const results=await Promise.all([0,1,2,3,0,1].map(e=>f.request('/progreso-area',{method:'POST',cookie,body:answer('matematicas',0,e)})));
  assert.ok(results.every(r=>r.status===200));const row=(await f.pool.query('SELECT progreso,estado FROM progreso_areas')).rows[0];assert.equal(Number(row.progreso),10);assert.equal(Object.keys(row.estado.correctas).length,4);
 }finally{await f.close();}
});
test('PG-N07 restricciones únicas y FK rechazan duplicados y huérfanos',async()=>{
 const db=await database();try{
  await db.query("INSERT INTO usuarios(nombre,email,password,rol) VALUES('QA','unique@example.test','fixture','estudiante')");
  await assert.rejects(db.query("INSERT INTO usuarios(nombre,email,password,rol) VALUES('QA',' UNIQUE@example.test ','fixture','estudiante')"),e=>e.code==='23505');
  await assert.rejects(db.query('INSERT INTO inscripciones VALUES(999,999)'),e=>e.code==='23503');
  await assert.rejects(db.query("INSERT INTO progreso_areas VALUES(1,'unique@example.test','ingles',101,'{}')"),e=>e.code==='23514');
 }finally{await db.end();}
});
async function launch(schema){
 const c=settings(),url=new URL('postgresql://127.0.0.1:'+c.port+'/'+c.database);url.username=c.appUser;url.password=c.appPassword;url.searchParams.set('options','-c search_path='+schema+',pg_catalog');
 const child=fork('backend/server.js',[],{env:{...process.env,DATABASE_URL:url.href,DATABASE_MODE:'local-test',DATABASE_SSL:'false',PORT:'0',JWT_SECRET:c.jwt},stdio:['ignore','ignore','ignore','ipc']});
 const info=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{child.kill();reject(Error('Timeout de arranque PostgreSQL nativo'));},15000);child.once('message',m=>{clearTimeout(timer);resolve(m);});child.once('exit',code=>{clearTimeout(timer);reject(Error('Servidor terminó antes de iniciar: '+code));});});
 return {base:'http://127.0.0.1:'+info.port,stop:()=>new Promise(resolve=>{if(child.exitCode!==null||child.signalCode!==null)return resolve();child.once('exit',resolve);child.kill('SIGTERM');})};
}
test('PG-N08 reinicio de proceso: sesión, progreso, simulacro y foto permanecen',async()=>{
 const db=await database();let server;
 try{
  server=await launch(db.schema);
  const request=async(path,body,cookie)=>{const r=await fetch(server.base+'/api'+path,{method:body?'POST':'GET',headers:{...(cookie?{Cookie:cookie}:{}),...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
  assert.equal((await request('/registro',{nombre:'QA reinicio',correo:'restart-native@example.test',password:'Prueba123!',rol:'estudiante'})).status,201);
  const login=await request('/login',{correo:'restart-native@example.test',password:'Prueba123!',rol:'estudiante'}),cookie=login.cookie;assert.equal(login.status,200);
  assert.equal((await request('/progreso-area',answer('ingles'),cookie)).status,200);
  assert.equal((await request('/simulacros',{id_resultado:require('crypto').randomUUID(),modalidad:'area',segundos:12,respuestas:[{id:'ingles:0',seleccionada:null}]},cookie)).status,201);
  const form=new FormData();form.append('foto',new Blob([await png()],{type:'image/png'}),'avatar.png');const photo=await request('/perfil/actualizar',form,cookie);assert.equal(photo.status,200);
  const bytes=Buffer.from(await(await fetch(server.base+photo.data.foto)).arrayBuffer());
  await server.stop();server=await launch(db.schema);
  assert.equal((await request('/perfil/restart-native@example.test',undefined,cookie)).status,200);
  assert.equal((await request('/progreso-areas/restart-native@example.test',undefined,cookie)).data.areas.ingles,3);
  assert.equal((await request('/simulacros',undefined,cookie)).data.resultados.length,1);
  assert.deepEqual(Buffer.from(await(await fetch(server.base+photo.data.foto)).arrayBuffer()),bytes);
  assert.equal((await request('/logout',{},cookie)).status,200);assert.equal((await request('/perfil/restart-native@example.test',undefined,cookie)).status,401);
 }finally{if(server)await server.stop();await db.end();}
});
