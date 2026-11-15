const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture}=require('../../tests/fixtures/app.cjs'),{browser}=require('./browser.cjs');
const out=path.join(process.env.QA_EVIDENCE_ROOT,'academico-browser');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const report={date:new Date().toISOString(),baseCommit:'a28beb7cce3d03560424c52e613ead91d2f081af',environment:{database:'PostgreSQL nativo/pg; datos ficticios'},cases:[]};
 for(const name of ['chrome','edge']){const f=await fixture(),b=await browser(name),c=await b.newContext({viewport:{width:1440,height:1000}});const errors=[];
  try{
   const email='academic-'+name+'@example.test';await f.register(email);const response=await c.request.post(f.base+'/api/login',{data:{correo:email,password:'Prueba123!',rol:'estudiante'}});assert.equal(response.status(),200);const login=await response.json();
   await c.addInitScript(user=>localStorage.setItem('datosVisionales',JSON.stringify({...user,tipo_usuario:user.rol})),login.usuario);const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(f.base+'/modulo-ciencias.html');await p.waitForFunction(()=>document.documentElement.dataset.learningReady==='true');
   const premature=await c.request.post(f.base+'/api/progreso-area',{data:{area:'ciencias',completarTema:2}});assert.equal(premature.status(),409);
   for(let t=0;t<5;t++){
    await p.click('#btn-tema-'+t);assert.equal(await p.locator('#tema-'+t).isVisible(),true);assert.equal(await p.locator('#btnCompletar-'+t).isDisabled(),true);
    for(let q=0;q<8;q++){await p.click('#ej-'+t+'-'+q+' button[onclick*="true"]');await p.waitForFunction(()=>document.documentElement.dataset.progressSync==='saved');}
    await p.click('#btnCompletar-'+t);await p.waitForFunction(()=>document.documentElement.dataset.progressSync==='saved');assert.match(await p.locator('#btnCompletar-'+t).textContent(),/Tema completado/);
    await p.screenshot({path:path.join(out,name+'-tema-'+t+'.png'),fullPage:true});
   }
   await p.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('prepicfes:u:'))localStorage.removeItem(key);});await p.reload();await p.waitForFunction(()=>document.documentElement.dataset.learningReady==='true');
   const areas=(await(await c.request.get(f.base+'/api/progreso-areas/'+email)).json());assert.equal(areas.areas.ciencias,100);assert.deepEqual(areas.estados.ciencias.completados,[0,1,2,3,4]);assert.equal(Object.keys(areas.estados.ciencias.correctas).length,40);assert.equal(await p.locator('#barraGlobal').evaluate(n=>n.style.width),'100%');assert.deepEqual(errors,[]);
   report.cases.push({browser:name,status:'PASS',checks:'Cinco temas navegables, 40 respuestas, completar prematuro 409, progreso 100 %, persistencia sin caché y cero errores JS',version:b.version()});
  }catch(e){report.cases.push({browser:name,status:'FAIL',error:e.message,errors});process.exitCode=1;}finally{await b.close();await f.close();}
 }
 fs.writeFileSync(path.join(out,'resultados.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})();
