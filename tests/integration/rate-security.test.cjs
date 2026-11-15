const {test}=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('../fixtures/app.cjs');
test('SEC cuota general pública y autenticaciones exitosas no consumen intentos fallidos',async()=>{
 const f=await fixture({rateLimitOptions:{limit:2}});
 try{
  await f.register('auth-quota@example.test');
  for(let i=0;i<3;i++)assert.equal((await f.login('auth-quota@example.test')).status,200);
  for(let i=0;i<2;i++)assert.equal((await f.login('auth-quota@example.test','estudiante','incorrecta')).status,401);
  assert.equal((await f.login('auth-quota@example.test','estudiante','incorrecta')).status,429);
 }finally{await f.close();}
 const g=await fixture({requestLimitOptions:{limit:2}});
 try{
  assert.equal((await g.request('/health')).status,200);assert.equal((await g.request('/health')).status,200);
  assert.equal((await g.request('/health')).status,429);
 }finally{await g.close();}
});
test('SEC cuotas por usuario: lecturas, aprendizaje, perfil y escrituras independientes',async()=>{
 const f=await fixture({accountLimitOptions:{read:{limit:2},learning:{limit:1},profile:{limit:1},write:{limit:1}}});
 try{
  await f.register('quota-a@example.test');await f.register('quota-b@example.test');
  const a=(await f.login('quota-a@example.test')).cookie,b=(await f.login('quota-b@example.test')).cookie;
  for(let i=0;i<2;i++)assert.equal((await f.request('/perfil/quota-a@example.test',{cookie:a})).status,200);
  const limited=await f.request('/perfil/quota-a@example.test',{cookie:a,headers:{'X-Forwarded-For':'192.0.2.3'}});assert.equal(limited.status,429);assert.ok(Number(limited.headers.get('retry-after'))>0);
  assert.equal((await f.request('/perfil/quota-b@example.test',{cookie:b})).status,200);
  assert.equal((await f.request('/perfil/actualizar',{method:'POST',cookie:a,body:{nombre:'QA'}})).status,200);
  assert.equal((await f.request('/perfil/actualizar',{method:'POST',cookie:a,body:{nombre:'QA'}})).status,429);
  const answer=require('../fixtures/aprendizaje.cjs').answer('matematicas').respuesta;
  assert.equal((await f.request('/progreso-area',{method:'POST',cookie:a,body:{area:'matematicas',respuesta:answer}})).status,200);
  assert.equal((await f.request('/progreso-area',{method:'POST',cookie:a,body:{area:'matematicas',respuesta:answer}})).status,429);
  assert.equal((await f.request('/progreso',{method:'POST',cookie:a,body:{}})).status,410);
  assert.equal((await f.request('/progreso',{method:'POST',cookie:a,body:{}})).status,429);
 }finally{await f.close();}
});
