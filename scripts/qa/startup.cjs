// Solo lectura contra un destino local deliberadamente cerrado, nunca DATABASE_URL real.
process.env.NODE_ENV='development';
process.env.DATABASE_URL='postgresql://fixture:fixture@127.0.0.1:1/prepicfes_test';
process.env.DATABASE_SSL='false';
process.env.OPENROUTER_API_KEY='';process.env.OPENROUTER_MODEL='';
process.env.JWT_SECRET=require('node:crypto').randomBytes(48).toString('hex');
const fs=require('node:fs');const assert=require('node:assert/strict');
const {createApp}=require('../../backend/server');
(async()=>{
 const app=createApp();const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 try{
  const url='http://127.0.0.1:'+server.address().port;
  const frontend=await fetch(url+'/index.html'),health=await fetch(url+'/api/health');
  assert.equal(frontend.status,200);assert.equal(health.status,503);
  assert.match(await frontend.text(),/Inicio de Sesión/);
  fs.mkdirSync('evidencias/sistema',{recursive:true});fs.writeFileSync('evidencias/sistema/arranque.json',JSON.stringify({date:new Date().toISOString(),node:process.version,scope:'Arranque nativo pg sin claves IA y con destino SQL local cerrado deliberadamente',frontend:{status:frontend.status,result:'PASS'},health:{status:health.status,result:'PASS',expected:'503 con base no disponible; no se afirma conexión exitosa'}},null,2));
  console.log('Arranque: frontend 200, health 503 esperado sin BD; proveedor IA no configurado.');
 }finally{await new Promise(resolve=>server.close(resolve));await app.locals.pool.end();}
})();
