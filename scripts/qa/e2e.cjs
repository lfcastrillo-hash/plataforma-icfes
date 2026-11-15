const fs = require('node:fs');
const assert = require('node:assert/strict');
const { fixture } = require('../../tests/fixtures/app.cjs');
const { browser, paths } = require('./browser.cjs');
const dir = require('node:path').join(process.env.QA_EVIDENCE_ROOT||'evidencias','aceptacion');
fs.mkdirSync(dir,{recursive:true});
const report = { date:new Date().toISOString(), environment:{ node:process.version, database:process.env.QA_DATABASE_ENGINE==='postgres'?'PostgreSQL nativo/pg aislado':'PGlite/PostgreSQL WASM aislado', networkMocks:false }, cases:[] };
async function run(name) {
  const f=await fixture();const b=await browser(name);
  report.environment[name]=b.version();
  const context=await b.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  const mail=name+'@example.test', teacher='teacher-'+mail;
  await f.register(mail);await f.register(teacher,'profesor');
  async function login(p,email,role='estudiante') {
    await p.goto(f.base+'/index.html');await p.fill('#correo',email);await p.fill('#password','Prueba123!');await p.selectOption('#rol',role);
    await p.click('button[onclick="iniciarSesion()"]');await p.waitForURL('**/panel-'+role+'.html');
  }
  async function scenario(id,description,action) {
    const start=Date.now();
    try { await action(); await page.screenshot({path:dir+'/'+name+'-'+id+'.png',fullPage:true}); report.cases.push({id,browser:name,description,status:'PASS',durationMs:Date.now()-start,evidence:name+'-'+id+'.png'}); console.log(name+' '+id+' PASS'); }
    catch(error){await page.screenshot({path:dir+'/'+name+'-'+id+'-fallo.png',fullPage:true});report.cases.push({id,browser:name,description,status:'FAIL',error:error.message});console.error(name+' '+id+' FAIL '+error.message);throw error;}
  }
  try {
    await scenario('CA01','Estudiante inicia sesión mediante el formulario y accede a su panel',async()=>{
      await login(page,mail);await page.waitForFunction(()=>document.querySelector('#saludo-estudiante')?.textContent.includes('Usuario'));
      assert.equal(await page.evaluate(()=>!!JSON.parse(localStorage.getItem('datosVisionales')).token),false);
    });
    await scenario('CA02','Completar tema, recargar sin caché de avance y verificar los cinco módulos',async()=>{
      await page.goto(f.base+'/modulo-matematicas.html');await page.waitForFunction(()=>document.documentElement.dataset.learningReady==='true');
      for(let i=0;i<8;i++){await page.click('#ej-0-'+i+' button[onclick*="true"]');}
      await page.waitForFunction(()=>document.documentElement.dataset.progressSync==='saved');
      await page.click('#btnCompletar-0');await page.waitForFunction(()=>document.documentElement.dataset.progressSync==='saved');
      await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('prepicfes:u:'))localStorage.removeItem(key);});
      await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.learningReady==='true');
      assert.equal(await page.locator('#btnCompletar-0').textContent(),'✓ Tema completado');
      for(const area of ['lectura','ciencias','sociales','ingles']){
        await page.goto(f.base+'/modulo-'+area+'.html');await page.waitForFunction(()=>document.documentElement.dataset.learningReady==='true');
        if(area==='lectura'){
          await page.click('#ej-0-0 button[onclick*="false"] >> nth=0');
          await page.waitForFunction(()=>document.querySelector('#fb-0-0')?.classList.contains('incorrecto'));
          assert.equal(await page.locator('#fb-0-0').evaluate(el=>el.classList.contains('incorrecto')),true);
          await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.learningReady==='true');
        }
        await page.click('#ej-0-0 button[onclick*="true"]');await page.waitForFunction(()=>document.documentElement.dataset.progressSync==='saved');
      }
      const ctx=await b.newContext();const q=await ctx.newPage();
      await f.register('isolated-'+mail);await login(q,'isolated-'+mail);
      await q.goto(f.base+'/modulo-matematicas.html');await q.waitForFunction(()=>document.documentElement.dataset.learningReady==='true');
      assert.equal(await q.locator('#ej-0-0 button[onclick*="true"]').isDisabled(),false);await ctx.close();
    });
    await scenario('CA02-pestanas','Una pestaña anterior no modifica el avance de la nueva cuenta',async()=>{
      const oldTab=await context.newPage();await oldTab.goto(f.base+'/modulo-matematicas.html');await oldTab.waitForFunction(()=>document.documentElement.dataset.learningReady==='true');
      await oldTab.click('#btn-tema-1');
      const switched=await context.newPage();await f.register('tabs-'+mail);await login(switched,'tabs-'+mail);
      await oldTab.click('#ej-1-0 button[onclick*="true"]');
      const progress=await switched.evaluate(async email=>(await (await fetch('/api/progreso-areas/'+encodeURIComponent(email))).json()).areas,'tabs-'+mail);
      assert.equal(progress.matematicas,0);
      await oldTab.close();await switched.close();await login(page,mail);
    });
    await scenario('CA03','Simulacro por área, omisiones, resultado reproducible y revisión',async()=>{
      await page.goto(f.base+'/simulacro-selector.html');await page.click('button[onclick*="mostrarTab(\'area\'"]');
      await page.click('.card-area[onclick*="ingles"]');await page.waitForURL('**/simulacro-nuevo.html');
      await page.waitForSelector('#opciones-lista button');
      await page.click('#opciones-lista button:first-child');await page.click('#btn-sig');
      // Omitir durante el feedback debe continuar, sin duplicar ni saltar una pregunta.
      await page.click('button[onclick="omitir()"]');
      await page.reload();await page.waitForSelector('#opciones-lista button');
      assert.match(await page.locator('#contador-txt').textContent(),/Pregunta 2 de/);
      for(let i=0;i<100 && !(await page.locator('#p-resultado').evaluate(el=>el.classList.contains('vis')));i++)await page.click('button[onclick="omitir()"]');
      await page.waitForFunction(()=>document.documentElement.dataset.resultSync==='saved');
      const saved=await page.evaluate(async()=>{const r=await fetch('/api/simulacros');return (await r.json()).resultados[0].resultado;});
      assert.equal(Number(await page.locator('#res-global').textContent()),saved.puntajeGlobal);
      assert.equal(saved.totalCorrectas+saved.totalIncorrectas+saved.totalOmitidas,saved.respuestas.length);
      await page.click('button[onclick="verRevision()"]');assert.equal(await page.locator('#revision-wrap').isVisible(),true);
      const previousScore=await page.locator('#res-global').textContent();await page.reload();
      await page.waitForFunction(()=>document.documentElement.dataset.resultSync==='saved');
      assert.equal(await page.locator('#res-global').textContent(),previousScore);
    });
    await scenario('CA03-extra','Modalidad general, por temas y configuración inválida',async()=>{
      await page.goto(f.base+'/simulacro-selector.html');await page.click('[onclick="iniciarGeneral()"]');
      await page.waitForURL('**/simulacro-nuevo.html');await page.waitForSelector('#opciones-lista button');
      assert.match(await page.locator('#contador-txt').textContent(),/Pregunta 1 de [1-9]/);
      await page.goto(f.base+'/simulacro-selector.html');await page.click('button[onclick*="mostrarTab(\'tema\'"]');
      assert.equal(await page.locator('#btn-tema').isDisabled(),true);
      await page.locator('.tema-chip').first().click();await page.click('#btn-tema');await page.waitForURL('**/simulacro-nuevo.html');await page.waitForSelector('#opciones-lista button');
      await page.evaluate(()=>sessionStorage.setItem('simulacro_config','{bad-json'));
      await page.reload();await page.waitForURL('**/simulacro-selector.html');
    });
    await scenario('CA04','Profesor crea clase, agrega estudiante, publica anuncio y retira inscripción',async()=>{
      const tc=await b.newContext();const t=await tc.newPage();t.on('dialog',d=>d.accept());await login(t,teacher,'profesor');
      await t.locator('[onclick="abrirModalCrearClase()"]').first().click();await t.fill('#input-nombre-clase','Grupo E2E');await t.click('[onclick="crearClase()"]');
      await t.waitForFunction(()=>document.querySelector('#tituloClase')?.textContent.includes('Grupo E2E'));
      await t.click('[onclick="abrirModalAgregarEstudiante()"]');await t.fill('#input-correo-estudiante',mail);await t.click('[onclick="agregarEstudiante()"]');
      await t.waitForFunction(()=>document.querySelector('#tablaEstudiantes')?.textContent.includes('@example.test'));
      await t.click('[onclick="abrirModalAnuncio()"]');await t.fill('#texto-anuncio','Anuncio de prueba E2E');await t.click('[onclick="guardarAnuncio()"]');
      await page.goto(f.base+'/panel-estudiante.html');await page.waitForFunction(()=>document.querySelector('#contenedor-anuncios')?.textContent.includes('Anuncio de prueba E2E'));
      await t.screenshot({path:dir+'/'+name+'-CA04-profesor.png',fullPage:true});
      await t.click('#tablaEstudiantes button.btn-danger');await t.waitForFunction(()=>document.querySelector('#statTotal')?.textContent==='0');
      await tc.close();
    });
    await scenario('CA05','Actualizar perfil, comprobar persistencia y cerrar sesión',async()=>{
      await page.goto(f.base+'/perfil-estudiante.html');await page.waitForFunction(()=>document.querySelector('#estudiante-nombre')?.textContent==='Usuario QA');
      await page.click('[onclick="abrirModalEditar()"]');await page.fill('#update-nombre','Estudiante Actualizado');await page.fill('#update-biografia','Preparación Saber 11');
      await page.click('[onclick="guardarPerfil()"]');await page.waitForFunction(()=>document.querySelector('#estudiante-nombre')?.textContent==='Estudiante Actualizado');
      await page.screenshot({path:dir+'/'+name+'-CA05-perfil.png',fullPage:true});
      await page.click('[onclick="cerrarSesion()"]');await page.waitForURL('**/index.html');
      assert.equal(await page.evaluate(()=>localStorage.getItem('datosVisionales')),null);
      assert.equal(await page.evaluate(async()=>(await fetch('/api/perfil/ignored@example.test')).status),401);
    });
    assert.deepEqual(errors,[]);report.cases.push({id:'JS-errors',browser:name,status:'PASS',errors});
  } finally {
    await b.close();await f.close();
  }
}
(async()=>{
  for(const name of (process.env.QA_BROWSERS || 'chrome,edge').split(',')) {
    if(paths[name] && !fs.existsSync(paths[name]) && !process.env.BROWSER_EXECUTABLE){report.cases.push({id:'browser',browser:name,status:'PENDING',reason:'Navegador no instalado'});continue;}
    try{await run(name);}catch{process.exitCode=1;}
  }
  fs.writeFileSync(dir+'/resultados.json',JSON.stringify(report,null,2));
})();
