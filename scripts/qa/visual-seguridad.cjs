const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const crypto=require('node:crypto');
const {PNG}=require('pngjs');
const {browser}=require('./browser.cjs');
const {fixture}=require('../../tests/fixtures/app.cjs');
const baseCommit='785be5edc3ee70bcc9f03b0c7387d9823874af23';
const reference='evidencias/verificacion-final/visual/actual';
const out=path.join(process.env.QA_EVIDENCE_ROOT||'evidencias/estabilizacion-seguridad-20261114','visual');
async function main(){
 fs.mkdirSync(out,{recursive:true});const f=await fixture(),b=await browser();
 const report={date:new Date().toISOString(),baseCommit,reference,environment:{browser:b.version(),viewport:'1440x1000',api:'Fixtures solo para comparación visual'},authorizedChange:'Retirar los 13 botones IA/✨: autorización explícita del usuario',cases:[],css:[]};
 try{
  for(const file of fs.readdirSync('frontend').filter(n=>n.endsWith('.html')&&(!process.env.QA_VISUAL_PAGES||process.env.QA_VISUAL_PAGES.split(',').includes(n)))){
   const context=await b.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
   await context.addInitScript(({prof})=>{localStorage.setItem('datosVisionales',JSON.stringify({id_usuario:prof?2:1,correo:prof?'profesor@example.test':'estudiante@example.test',nombre:prof?'Profesor QA':'Estudiante QA',tipo_usuario:prof?'profesor':'estudiante'}));sessionStorage.setItem('simulacro_config',JSON.stringify({tipo:'area',area:'matematicas'}));Math.random=()=>0.5;},{prof:/profesor|clases\.html/.test(file)});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/api/**',r=>{const prof=/profesor|clases\.html/.test(file),url=r.request().url();let data={success:true,clases:[],anuncios:[],areas:{},estados:{},progreso:0};
    if(url.includes('/perfil/'))data={id_usuario:prof?2:1,nombre:prof?'Profesor QA':'Estudiante QA',email:prof?'profesor@example.test':'estudiante@example.test',rol:prof?'profesor':'estudiante',foto_perfil:null,biografia:'',lista_clases:[]};
    if(file==='clases.html'&&url.includes('/clases'))data.clases=[{nombre_clase:'Matemáticas 11A',codigo_acceso:'ICFES11A'}];return r.fulfill({json:data});});
   await page.goto(f.base+'/'+file);await page.waitForTimeout(300);
   await page.screenshot({path:path.join(out,file+'.png'),fullPage:true,animations:'disabled'});
   const current=PNG.sync.read(fs.readFileSync(path.join(out,file+'.png'))),old=PNG.sync.read(fs.readFileSync(path.join(reference,file+'.png')));
   const actualErrors=[...errors];const removedCount=await page.locator('[onclick="abrirChat()"]').count();
   const html=execFileSync('git',['show',baseCommit+':frontend/'+file],{encoding:'utf8'});
   await page.route('**/'+file+'*',r=>r.fulfill({contentType:'text/html',body:html}));
   await page.goto(f.base+'/'+file+'?original=1');await page.waitForTimeout(300);
   const bounds=await page.locator('[onclick="abrirChat()"]').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
   const regenerated=PNG.sync.read(await page.screenshot({fullPage:true,animations:'disabled'}));
   const referenceMatches=regenerated.data.equals(old.data);
   // Comparar contra el HEAD quitando solo el botón en el DOM de referencia.
   // Así se incluye su sombra real sin tolerancias geométricas que oculten diferencias.
   await page.locator('[onclick="abrirChat()"]').evaluateAll(nodes=>nodes.forEach(n=>n.remove()));
   const expected=PNG.sync.read(await page.screenshot({fullPage:true,animations:'disabled'}));
   let changed=0,outside=0;const unexpectedSamples=[];const sameDimensions=current.width===old.width&&current.height===old.height;
   if(sameDimensions)for(let y=0;y<old.height;y++)for(let x=0;x<old.width;x++){
    const i=(y*old.width+x)*4;if(!old.data.subarray(i,i+4).equals(current.data.subarray(i,i+4)))changed++;
    if(!expected.data.subarray(i,i+4).equals(current.data.subarray(i,i+4))){outside++;if(unexpectedSamples.length<20)unexpectedSamples.push({x,y,expected:[...expected.data.subarray(i,i+4)],actual:[...current.data.subarray(i,i+4)]});}
   }
   if(outside)fs.writeFileSync(path.join(out,file+'.esperado.png'),PNG.sync.write(expected));
   report.cases.push({file,status:sameDimensions&&referenceMatches&&outside===0&&removedCount===0&&!actualErrors.length?'PASS':'FAIL',referenceMatches,sameDimensions,changedPixels:changed,unexpectedPixels:outside,unexpectedSamples,authorizedRemovedButtons:bounds.length,authorizedRegions:bounds,actualPageErrors:actualErrors});await context.close();
  }
  for(const file of fs.readdirSync('frontend/css')){const actual=fs.readFileSync('frontend/css/'+file),original=execFileSync('git',['show',baseCommit+':frontend/css/'+file]);report.css.push({file,contentUnchanged:actual.toString('utf8').replace(/\r/g,'')===original.toString('utf8').replace(/\r/g,''),sha256:crypto.createHash('sha256').update(actual).digest('hex')});}
  fs.writeFileSync(path.join(out,'comparacion.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pages:report.cases.length,pass:report.cases.filter(c=>c.status==='PASS').length,fail:report.cases.filter(c=>c.status!=='PASS'),removed:report.cases.reduce((n,c)=>n+c.authorizedRemovedButtons,0),css:report.css},null,2));
  if(report.cases.some(c=>c.status!=='PASS')||report.css.some(c=>!c.contentUnchanged))process.exitCode=1;
 }finally{await b.close();await f.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
