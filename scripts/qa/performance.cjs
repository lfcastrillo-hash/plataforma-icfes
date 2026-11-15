// Microprueba local acotada; no sustituye JMeter ni representa producción.
const fs=require('node:fs');
const {performance}=require('node:perf_hooks');
const {randomUUID}=require('node:crypto');
const {fixture}=require('../../tests/fixtures/app.cjs');
const {answer}=require('../../tests/fixtures/aprendizaje.cjs');
(async()=>{
 const f=await fixture();const results=[];
 try{
  await f.register('load@example.test');await f.register('prof-load@example.test','profesor');
  const s=(await f.login('load@example.test')).cookie,p=(await f.login('prof-load@example.test','profesor')).cookie;
  const scenarios=[['M1-login',()=>f.login('load@example.test')],['M2-aprendizaje',()=>f.request('/progreso-area',{method:'POST',cookie:s,body:answer('ingles')})],['M3-simulacro',()=>f.request('/simulacros',{method:'POST',cookie:s,body:{id_resultado:randomUUID(),modalidad:'area',segundos:10,respuestas:[{id:'ingles:0',seleccionada:null}]}})],['M4-clases',()=>f.request('/clases',{method:'POST',cookie:p,body:{nombre_clase:'Grupo rendimiento'}})],['M5-perfil',()=>f.request('/perfil/load@example.test',{cookie:s})]];
  for(const [id,action] of scenarios){const times=[];let errors=0;const start=performance.now();for(let i=0;i<20;i++){const t=performance.now();const r=await action();times.push(performance.now()-t);if(r.status>=400)errors++;}const elapsed=performance.now()-start;times.sort((a,b)=>a-b);
   results.push({id,samples:20,concurrency:1,errors,meanMs:times.reduce((a,b)=>a+b,0)/20,p50Ms:times[9],p95Ms:times[18],p99Ms:times[19],throughputPerSecond:20/(elapsed/1000)});
  }
  const out=require('path').join(process.env.QA_EVIDENCE_ROOT||'evidencias','sistema');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(require('path').join(out,'rendimiento-local.json'),JSON.stringify({date:new Date().toISOString(),environment:{node:process.version,database:f.pool.engine},scope:'Microprueba local secuencial, 20 muestras por operación; no ensayo de carga en producción ni ejecución JMeter',results},null,2));
  console.table(results);if(results.some(r=>r.errors))process.exitCode=1;
 }finally{await f.close();}
})();
