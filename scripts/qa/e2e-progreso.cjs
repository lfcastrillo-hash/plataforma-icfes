const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture}=require('../../tests/fixtures/app.cjs');
const {browser}=require('./browser.cjs');
const out=path.join(process.env.QA_EVIDENCE_ROOT||'evidencias/estabilizacion-seguridad-20261114','progreso-browser');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const f=await fixture(),b=await browser();
 const report={date:new Date().toISOString(),environment:{browser:b.version(),database:f.pool.engine},cases:[]};
 try{
  const context=await b.newContext({viewport:{width:1440,height:1000}}),email='progress-browser@example.test';
  await f.register(email);const response=await context.request.post(f.base+'/api/login',{data:{correo:email,password:'Prueba123!',rol:'estudiante'}});
  assert.equal(response.status(),200);const login=await response.json();
  await context.addInitScript(user=>localStorage.setItem('datosVisionales',JSON.stringify({...user,tipo_usuario:user.rol})),login.usuario);
  const page=await context.newPage();await page.goto(f.base+'/modulo-matematicas.html');await page.waitForFunction(()=>document.documentElement.dataset.learningReady==='true');
  const forged=await page.evaluate(async()=>{const r=await fetch('/api/progreso-area',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({area:'matematicas',progreso:100,estado:{correctas:{'0-0':true}}})});return r.status;});assert.equal(forged,400);
  await page.evaluate(()=>{
   const id=JSON.parse(localStorage.getItem('datosVisionales')).id_usuario;
   const correctas={};for(let t=0;t<5;t++)for(let e=0;e<8;e++)correctas[t+'-'+e]=true;
   localStorage.setItem('prepicfes:u:'+id+':mat_correctas',JSON.stringify(correctas));
   localStorage.setItem('prepicfes:u:'+id+':mat_completados','[0,1,2,3,4]');
  });
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.learningReady==='true');
  assert.equal(await page.locator('#ej-0-0 button[onclick*="true"]').isDisabled(),false);
  assert.equal(await page.evaluate(async email=>(await (await fetch('/api/progreso-areas/'+email)).json()).areas.matematicas,email),0);
  report.cases.push({id:'PROG-TAMPER',status:'PASS',checks:'Porcentaje y caché falsificados no modifican el progreso acreditado; recarga obtiene estado del servidor.'});
  await page.click('#ej-0-0 button[onclick*="false"] >> nth=0');await page.waitForFunction(()=>document.documentElement.dataset.progressSync==='saved');
  assert.equal(await page.evaluate(async email=>(await (await fetch('/api/progreso-areas/'+email)).json()).areas.matematicas,email),0);
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.learningReady==='true');
  await page.click('#ej-0-0 button[onclick*="true"]');await page.waitForFunction(()=>document.documentElement.dataset.progressSync==='saved');
  assert.equal(await page.evaluate(async email=>(await (await fetch('/api/progreso-areas/'+email)).json()).areas.matematicas,email),3);
  report.cases.push({id:'PROG-GRADE',status:'PASS',checks:'Opción incorrecta no acredita; selección correcta evaluada por servidor acredita 3 %.'});
  await context.setOffline(true);await page.click('#ej-0-1 button[onclick*="true"]');
  await page.waitForFunction(()=>document.documentElement.dataset.progressSync==='pending');
  await context.setOffline(false);await page.waitForFunction(()=>document.documentElement.dataset.progressSync==='saved');
  assert.equal(await page.evaluate(async email=>(await (await fetch('/api/progreso-areas/'+email)).json()).areas.matematicas,email),5);
  report.cases.push({id:'PROG-OFFLINE',status:'PASS',checks:'La opción pendiente se conserva sin acreditar porcentajes; al volver la conexión se valida y alcanza 5 %.'});
  await page.screenshot({path:path.join(out,'matematicas.png'),fullPage:true});await context.close();
 }catch(error){report.error=error.message;process.exitCode=1;}
 finally{fs.writeFileSync(path.join(out,'resultados.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await b.close();await f.close();}
})();
