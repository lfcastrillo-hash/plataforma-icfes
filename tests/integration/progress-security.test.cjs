const {test}=require('node:test');
const assert=require('node:assert/strict');
const {fixture}=require('../fixtures/app.cjs');
const {answer}=require('../fixtures/aprendizaje.cjs');
test('SEC progreso: no acreditar porcentajes, estados, booleanos ni ejercicios inexistentes',async()=>{
 const f=await fixture();try{
  await f.register('secure-progress@example.test');const cookie=(await f.login('secure-progress@example.test')).cookie;
  const send=body=>f.request('/progreso-area',{method:'POST',cookie,body});
  for(const body of [
   {area:'matematicas',progreso:100},
   {area:'matematicas',progreso:0,estado:{correctas:{'0-0':true},completados:[]}},
   {...answer('matematicas'),progreso:100},
   {area:'matematicas',respuesta:{tema:0,ejercicio:0,opcion:0,correcta:true}},
   {area:'matematicas',respuesta:{tema:0,ejercicio:0,opcion:'0'}},
   {area:'ciencias',respuesta:{tema:2,ejercicio:0,opcion:0}},
   {area:'matematicas',respuesta:{tema:0,ejercicio:0,opcion:4}},
  ])assert.equal((await send(body)).status,400);
  assert.equal((await send({area:'matematicas',completarTema:0})).status,409);
  const wrong=await send(answer('matematicas',0,0,false));assert.equal(wrong.status,200);assert.equal(wrong.data.correcta,false);assert.equal(wrong.data.progreso,0);
  const good=await send(answer('matematicas'));assert.equal(good.data.correcta,true);assert.equal(good.data.progreso,3);
  await Promise.all(Array.from({length:4},()=>send(answer('matematicas'))));
  const duplicate=await send(answer('matematicas'));assert.equal(duplicate.data.progreso,3);
  const bulk=await f.request('/progreso',{method:'POST',cookie,body:{matematicas:100,lectura:100,ciencias:100,sociales:100,ingles:100}});assert.equal(bulk.status,410);
  const read=await f.request('/progreso-areas/secure-progress@example.test',{cookie});assert.equal(read.data.areas.matematicas,3);assert.equal(read.data.areas.ingles,0);
 }finally{await f.close();}
});
test('SEC progreso: conservar agregado y estado históricos sin aceptar otro estado desde el cliente',async()=>{
 const f=await fixture();try{
  await f.register('history-progress@example.test');const login=await f.login('history-progress@example.test');const cookie=login.cookie;
  await f.pool.query('INSERT INTO progreso_areas(id_usuario,correo,area,progreso,estado) VALUES($1,$2,$3,$4,$5)',[login.data.usuario.id_usuario,'history-progress@example.test','matematicas',65,JSON.stringify({correctas:{'0-0':true},completados:[]})]);
  const result=await f.request('/progreso-area',{method:'POST',cookie,body:answer('matematicas',0,1)});
  assert.equal(result.status,200);assert.equal(result.data.progreso,65);assert.equal(result.data.estado.legacy.correctas['0-0'],true);assert.equal(result.data.estado.correctas['0-1'],true);
 }finally{await f.close();}
});
