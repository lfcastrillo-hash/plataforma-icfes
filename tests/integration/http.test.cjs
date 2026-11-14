const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const jwt = require('../../backend/node_modules/jsonwebtoken');
const config = require('../../backend/config');
const { fixture } = require('../fixtures/app.cjs');
let f, s, other, p, p2, classId;
before(async()=>{
  f=await fixture();
  for(const [mail,role] of [['a@example.test','estudiante'],['b@example.test','estudiante'],['p@example.test','profesor'],['p2@example.test','profesor']])assert.equal((await f.register(mail,role)).status,201);
  s=(await f.login('a@example.test')).cookie;other=(await f.login('b@example.test')).cookie;
  p=(await f.login('p@example.test','profesor')).cookie;p2=(await f.login('p2@example.test','profesor')).cookie;
});
after(async()=>{await f?.close();});
test('IT01/CU02 registro, duplicado normalizado y hash en PostgreSQL',async()=>{
  assert.equal((await f.register('A@EXAMPLE.TEST')).status,409);
  const users=await f.pool.query('SELECT password FROM usuarios');assert.ok(users.rows.every(u=>u.password.startsWith('scrypt$')));
  const login=await f.login('a@example.test');assert.equal(login.status,200);assert.equal(login.data.token,undefined);
  assert.match(login.headers.get('set-cookie'),/HttpOnly/);assert.match(login.headers.get('set-cookie'),/SameSite=Lax/);
  assert.equal((await f.login('a@example.test','estudiante','incorrecta')).status,401);
  assert.equal((await f.login('a@example.test','profesor')).status,401);
  assert.equal((await f.login('unknown@example.test')).status,401);
});
test('IT01 negativos de autenticación y entrada obligatoria',async()=>{
  for(const body of [{},{nombre:'a',correo:'bad',password:'123',rol:'admin'},{nombre:[],correo:'x@example.test',password:'12345678',rol:'estudiante'}])assert.equal((await f.request('/registro',{method:'POST',body})).status,400);
  assert.equal((await f.request('/progreso-area',{method:'POST',body:{area:'matematicas',progreso:100}})).status,401);
  assert.equal((await f.request('/perfil/a@example.test',{cookie:'token_acceso=invalid'})).status,401);
  const expired=jwt.sign({id_usuario:1},config.jwtSecret,{algorithm:'HS256',expiresIn:-1,issuer:'prepicfes',audience:'prepicfes-web',jwtid:randomUUID()});
  assert.equal((await f.request('/perfil/a@example.test',{cookie:'token_acceso='+expired})).status,401);
  assert.equal((await f.request('/login',{method:'POST',body:{}})).status,400);
});
test('IT02/CU03 progreso aislado, monotónico, persistente e idempotente',async()=>{
  const body={area:'matematicas',progreso:20,estado:{correctas:Object.fromEntries(Array.from({length:8},(_,i)=>['0-'+i,true])),completados:[0]}};
  for(let i=0;i<2;i++)assert.equal((await f.request('/progreso-area',{method:'POST',cookie:s,body})).status,200);
  assert.equal((await f.request('/progreso-general/a@example.test',{cookie:s})).data.progreso,4);
  assert.equal((await f.request('/progreso-general/b@example.test',{cookie:other})).data.progreso,0);
  assert.equal((await f.request('/progreso-areas/b@example.test',{cookie:s})).status,403);
  assert.equal((await f.request('/progreso-area',{method:'POST',cookie:s,body:{...body,correo:'b@example.test'}})).status,403);
  assert.equal((await f.request('/progreso-area',{method:'POST',cookie:other,headers:{'X-Prep-User':'1'},body})).status,403);
  assert.equal((await f.request('/progreso-area',{method:'POST',cookie:s,body:{area:'matematicas',progreso:0}})).status,200);
  const areas=(await f.request('/progreso-areas/a@example.test',{cookie:s})).data;
  assert.equal(areas.areas.matematicas,20);assert.equal(areas.estados.matematicas.completados[0],0);
  const fresh=(await f.login('a@example.test')).cookie;
  assert.equal((await f.request('/progreso-areas/a@example.test',{cookie:fresh})).data.areas.matematicas,20);
});
test('IT02 límites y tipos de aprendizaje',async()=>{
  for(const progreso of [-1,101,'50',null])assert.equal((await f.request('/progreso-area',{method:'POST',cookie:s,body:{area:'ingles',progreso}})).status,400);
  assert.equal((await f.request('/progreso-area',{method:'POST',cookie:s,body:{area:'unknown',progreso:50}})).status,400);
  assert.equal((await f.request('/progreso-area',{method:'POST',cookie:p,body:{area:'ingles',progreso:50}})).status,403);
  assert.equal((await f.request('/progreso',{method:'POST',cookie:s,body:{matematicas:10}})).status,400);
});
test('IT03/CU11 crear clases, rol y propietario',async()=>{
  assert.equal((await f.request('/clases',{method:'POST',cookie:s,body:{nombre_clase:'Intrusa'}})).status,403);
  assert.equal((await f.request('/clases',{method:'POST',cookie:p,body:{nombre_clase:' '}})).status,400);
  const result=await f.request('/clases',{method:'POST',cookie:p,body:{nombre_clase:'Grupo QA',correo_profesor:'p2@example.test'}});
  assert.equal(result.status,201);classId=result.data.clase.id_clase;
  assert.equal((await f.request('/clases?correo=p2@example.test',{cookie:p})).data.clases.length,1);
  assert.equal((await f.request('/clases',{cookie:p2})).data.clases.length,0);
  assert.equal((await f.request('/clases/'+classId,{method:'DELETE',cookie:p2})).status,404);
  assert.equal((await f.request('/clases/invalid',{method:'DELETE',cookie:p})).status,400);
});
test('IT04 inscripciones, duplicados y promedio entre cinco áreas',async()=>{
  const body={id_clase:classId,email:'a@example.test'};
  assert.equal((await f.request('/inscripciones/agregar',{method:'POST',cookie:p2,body})).status,404);
  assert.equal((await f.request('/inscripciones/agregar',{method:'POST',cookie:p,body})).status,200);
  assert.equal((await f.request('/inscripciones/agregar',{method:'POST',cookie:p,body})).status,409);
  assert.equal((await f.request('/clases/'+classId+'/estudiantes',{cookie:p2})).status,404);
  const list=await f.request('/clases/'+classId+'/estudiantes',{cookie:p});assert.equal(Number(list.data.estudiantes[0].puntaje),4);
  assert.equal((await f.request('/estudiante/mis-clases',{cookie:s})).data.clases.length,1);
  assert.equal((await f.request('/estudiante/mis-clases',{cookie:other})).data.clases.length,0);
  assert.equal((await f.request('/estudiantes/buscar?q=a@example.test',{cookie:p})).data.student.clases.length,1);
  assert.equal((await f.request('/estudiantes/buscar?q=a@exam',{cookie:p})).data.student.clases.length,1);
  assert.equal((await f.request('/estudiantes/buscar?q=a@exam',{cookie:p2})).data.student,null);
  assert.equal((await f.request('/estudiantes/buscar?q=a',{cookie:p})).status,400);
});
test('IT05 anuncios disponibles solo para inscritos',async()=>{
  assert.equal((await f.request('/clases/'+classId+'/anuncio',{method:'POST',cookie:p2,body:{anuncio:'Intruso'}})).status,404);
  assert.equal((await f.request('/clases/'+classId+'/anuncio',{method:'POST',cookie:p,body:{anuncio:'Repasar funciones'}})).status,200);
  assert.equal((await f.request('/estudiante/anuncios',{cookie:s})).data.anuncios[0].anuncio,'Repasar funciones');
  assert.equal((await f.request('/estudiante/anuncios',{cookie:other})).data.anuncios.length,0);
  assert.equal((await f.request('/clases/'+classId+'/anuncio',{method:'POST',cookie:p,body:{anuncio:'x'.repeat(5001)}})).status,400);
});
test('IT06/CU08 perfil, cambio correo conserva clases y progreso por ID',async()=>{
  assert.equal((await f.request('/perfil/b@example.test',{cookie:s})).status,403);
  assert.equal((await f.request('/perfil/actualizar',{method:'POST',cookie:s,body:{nuevo_correo:'b@example.test',nombre:'No guardar'}})).status,409);
  assert.equal((await f.request('/perfil/a@example.test',{cookie:s})).data.nombre,'Usuario QA');
  const result=await f.request('/perfil/actualizar',{method:'POST',cookie:s,body:{nombre:'Nuevo QA',nuevo_correo:'nuevo@example.test',biografia:'Biografía de prueba'}});
  assert.equal(result.status,200);
  assert.equal((await f.request('/progreso-general/nuevo@example.test',{cookie:s})).data.progreso,4);
  assert.equal((await f.request('/estudiante/mis-clases',{cookie:s})).data.clases.length,1);
  assert.equal((await f.login('a@example.test')).status,401);
  assert.equal((await f.login('nuevo@example.test')).status,200);
  assert.equal((await f.request('/perfil/actualizar',{method:'POST',cookie:s,body:{biografia:'x'.repeat(2001)}})).status,400);
});
test('IT07 foto persistida en BD, límites y archivos peligrosos rechazados',async()=>{
  const form=new FormData();form.append('foto',new Blob(['<svg onload=alert(1)>'],{type:'image/png'}),'fake.png');
  assert.equal((await f.request('/perfil/actualizar',{method:'POST',cookie:s,body:form})).status,400);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a23cAAAAASUVORK5CYII=','base64');
  const valid=new FormData();valid.append('foto',new Blob([png],{type:'image/png'}),'../avatar.png');
  const result=await f.request('/perfil/actualizar',{method:'POST',cookie:s,body:valid});assert.equal(result.status,200);
  const response=await fetch(f.base+result.data.foto);assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/png');
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),png);
  for(const size of [2*1024*1024-1,2*1024*1024]){
    const boundary=new FormData();boundary.append('foto',new Blob([Buffer.concat([png,Buffer.alloc(size-png.length)])],{type:'image/png'}),'boundary.png');
    assert.equal((await f.request('/perfil/actualizar',{method:'POST',cookie:s,body:boundary})).status,200);
  }
  const large=new FormData();large.append('foto',new Blob([Buffer.alloc(2*1024*1024+1)]),'large.png');
  assert.equal((await f.request('/perfil/actualizar',{method:'POST',cookie:s,body:large})).status,413);
});
test('IT08 contraseña revoca otras sesiones; logout revoca también JWT copiado',async()=>{
  const second=(await f.login('nuevo@example.test')).cookie;
  assert.equal((await f.request('/perfil/actualizar',{method:'POST',cookie:s,body:{password:'Nueva123!'}})).status,200);
  assert.equal((await f.request('/perfil/nuevo@example.test',{cookie:second})).status,401);
  assert.equal((await f.login('nuevo@example.test','estudiante','Prueba123!')).status,401);
  assert.equal((await f.login('nuevo@example.test','estudiante','Nueva123!')).status,200);
  assert.equal((await f.request('/logout',{method:'POST',cookie:s})).status,200);
  assert.equal((await f.request('/perfil/nuevo@example.test',{cookie:s})).status,401);
});
test('CU05 simulacro: calificación servidor, idempotencia y aislamiento',async()=>{
  const {BANCOS}=require('../../frontend/js/banco-simulacro');
  const body={id_resultado:randomUUID(),modalidad:'area',segundos:60,respuestas:[{id:'ingles:0',seleccionada:BANCOS.ingles[0].correcta}]};
  const result=await f.request('/simulacros',{method:'POST',cookie:other,body});assert.equal(result.status,201);assert.equal(result.data.resultado.puntajeGlobal,500);
  assert.equal((await f.request('/simulacros',{method:'POST',cookie:other,body})).status,200);
  assert.equal((await f.request('/simulacros',{cookie:other})).data.resultados.length,1);
  const fresh=(await f.login('nuevo@example.test','estudiante','Nueva123!')).cookie;
  assert.equal((await f.request('/simulacros',{cookie:fresh})).data.resultados.length,0);
  assert.equal((await f.request('/simulacros',{method:'POST',cookie:fresh,body})).status,409);
  assert.equal((await f.request('/simulacros',{method:'POST',cookie:other,body:{...body,id_resultado:randomUUID(),respuestas:[...body.respuestas,...body.respuestas]}})).status,400);
  assert.equal((await f.request('/simulacros',{method:'POST',cookie:other,body:{...body,respuestas:[{id:'ingles:99999',seleccionada:8}]}})).status,400);
});
test('IT09 retiro, eliminación transaccional y sin huérfanos',async()=>{
  const body={id_clase:classId,email:'nuevo@example.test'};
  assert.equal((await f.request('/inscripciones/remover',{method:'POST',cookie:p2,body})).status,404);
  assert.equal((await f.request('/inscripciones/remover',{method:'POST',cookie:p,body})).status,200);
  assert.equal((await f.request('/clases/'+classId+'/estudiantes',{cookie:p})).data.estudiantes.length,0);
  assert.equal((await f.request('/inscripciones/agregar',{method:'POST',cookie:p,body})).status,200);
  assert.equal((await f.request('/clases/'+classId,{method:'DELETE',cookie:p})).status,200);
  assert.equal((await f.pool.query('SELECT * FROM inscripciones')).rows.length,0);
});
test('SEC origen, endpoints desconocidos y health',async()=>{
  assert.equal((await f.request('/health')).status,200);
  assert.equal((await f.request('/unknown')).status,404);
  assert.equal((await f.request('/login',{method:'POST',headers:{Origin:'https://evil.example'},body:{}})).status,403);
  assert.equal((await f.request('/chat',{method:'POST',cookie:other,body:{mensaje:' '}})).status,400);
  assert.equal((await f.request('/chat',{method:'POST',cookie:other,body:{mensaje:'¿Qué es una función?'}})).status,503);
});
