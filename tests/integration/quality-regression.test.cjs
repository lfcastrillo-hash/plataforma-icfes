const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {fixture}=require('../fixtures/app.cjs');
const {BANCOS,CONFIG_AREAS}=require('../../frontend/js/banco-simulacro');
test('Regresión: general completo y rechazo de parcial e identificadores no canónicos',async()=>{
 const f=await fixture();try{
  await f.register('quality@example.test');const {cookie}=await f.login('quality@example.test');
  const send=(modalidad,respuestas)=>f.request('/simulacros',{method:'POST',cookie,body:{id_resultado:randomUUID(),modalidad,respuestas,segundos:60}});
  const one={id:'ingles:0',seleccionada:BANCOS.ingles[0].correcta};
  assert.equal((await send('general',[one])).status,400);
  assert.equal((await send('area',[one,{...one,id:'ingles:00'}])).status,400);
  const full=Object.entries(CONFIG_AREAS).flatMap(([area,c])=>BANCOS[area].slice(0,c.nGeneral).map((q,i)=>({id:area+':'+i,seleccionada:q.correcta})));
  const result=await send('general',full);assert.equal(result.status,201);assert.equal(result.data.resultado.totalCorrectas,85);
 }finally{await f.close();}
});
test('Regresión: contraseña cambiada antes de crear sesión invalida login anterior',async()=>{
 const f=await fixture();let release;
 try{
  await f.register('race@example.test');const current=await f.login('race@example.test');
  const query=f.pool.query.bind(f.pool);let notify,paused=false;
  const started=new Promise(r=>{notify=r;});const continuation=new Promise(r=>{release=r;});
  f.pool.query=async(sql,values)=>{const result=await query(sql,values);if(!paused&&sql.startsWith('SELECT id_usuario,nombre,email,password,rol FROM usuarios WHERE lower(email)')){paused=true;notify();await continuation;}return result;};
  const login=f.login('race@example.test');await started;
  assert.equal((await f.request('/perfil/actualizar',{method:'POST',cookie:current.cookie,body:{password:'NuevaClave123!'}})).status,200);
  release();assert.equal((await login).status,401);
  assert.equal((await f.login('race@example.test','estudiante','NuevaClave123!')).status,200);
 }finally{release?.();await f.close();}
});
