const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),crypto=require('node:crypto');
const {PNG}=require('pngjs'),{fixture}=require('../../tests/fixtures/app.cjs'),{browser}=require('./browser.cjs');
const base='a28beb7cce3d03560424c52e613ead91d2f081af',root=process.env.QA_EVIDENCE_ROOT;
if(!root)throw Error('QA_EVIDENCE_ROOT obligatorio');
const corrections=JSON.parse(fs.readFileSync('docs/tecnica/correcciones-academicas.json'));
(async()=>{
 const out=path.join(root,'visual-academico');fs.mkdirSync(out,{recursive:true});const f=await fixture(),b=await browser();const report={date:new Date().toISOString(),baseCommit:base,scope:'Comparación del diseño neutralizando exclusivamente los cambios de contenido registrados; capturas actuales conservadas sin neutralizar.',cases:[],newCards:[]};
 try{for(const file of fs.readdirSync('frontend').filter(f=>f.endsWith('.html'))){
  const c=await b.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});await c.addInitScript(({prof})=>{localStorage.setItem('datosVisionales',JSON.stringify({id_usuario:prof?2:1,correo:prof?'profesor@example.test':'estudiante@example.test',nombre:prof?'Profesor QA':'Estudiante QA',tipo_usuario:prof?'profesor':'estudiante'}));sessionStorage.setItem('simulacro_config',JSON.stringify({tipo:'area',area:'matematicas'}));Math.random=()=>.5;},{prof:/profesor|clases\.html/.test(file)});
  const p=await c.newPage();p.on('dialog',d=>d.dismiss());const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('**/api/**',route=>{const prof=/profesor|clases\.html/.test(file),url=route.request().url();let data={success:true,clases:[],anuncios:[],areas:{},estados:{},progreso:0};if(url.includes('/perfil/'))data={id_usuario:prof?2:1,nombre:prof?'Profesor QA':'Estudiante QA',email:prof?'profesor@example.test':'estudiante@example.test',rol:prof?'profesor':'estudiante',foto_perfil:null,biografia:'',lista_clases:[]};if(file==='clases.html'&&url.includes('/clases'))data.clases=[{nombre_clase:'Matemáticas 11A',codigo_acceso:'ICFES11A'}];return route.fulfill({json:data});});
  await p.goto(f.base+'/'+file);await p.waitForTimeout(300);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(100);await p.screenshot({path:path.join(out,file+'.actual.png'),fullPage:true,animations:'disabled'});
  const html=execFileSync('git',['show',base+':frontend/'+file],{encoding:'utf8'}),appErrors=[...errors];
  await p.evaluate(({items,original})=>{
   document.querySelectorAll('[data-academico-nuevo]').forEach(n=>n.remove());
   for(const item of items){if(!item.marker)continue;const n=document.querySelector('[data-academico-editado="'+item.marker+'"]');if(!n)throw Error('Marcador de edición ausente');n.innerHTML=item.before;n.removeAttribute('data-academico-editado');}
   const source=new DOMParser().parseFromString(original,'text/html');
   // Cambios autorizados del cierre de recursos: solo contenido y disponibilidad.
   if(['cuadernillos.html','entrenando.html','filtros.html','mas-material.html','clases_grabadas.html'].includes(location.pathname.split('/').pop())){
    for(const selector of ['.card h3','.card p','.card a','.card button']){
     const current=[...document.querySelectorAll(selector)],before=[...source.querySelectorAll(selector)];
     if(current.length!==before.length)throw Error('Cambió la estructura visual de recursos');
     current.forEach((node,i)=>{node.innerHTML=before[i].innerHTML;for(const a of [...node.attributes])node.removeAttribute(a.name);for(const a of before[i].attributes)node.setAttribute(a.name,a.value);});
    }
   }
   for(const item of items.filter(i=>i.part==='answer-key')){const target=document.getElementById(item.scope),old=source.getElementById(item.scope);[...target.querySelectorAll('.opcion-btn')].forEach((n,i)=>n.setAttribute('onclick',old.querySelectorAll('.opcion-btn')[i].getAttribute('onclick')));}
  },{items:corrections.filter(r=>r.file==='frontend/'+file),original:html});
  const normalized=PNG.sync.read(await p.screenshot({path:path.join(out,file+'.diseno.png'),fullPage:true,animations:'disabled'}));
  await p.route('**/'+file+'*',r=>r.fulfill({contentType:'text/html',body:html}));await p.route('**/js/banco-simulacro.js',r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show',base+':frontend/js/banco-simulacro.js'],{encoding:'utf8'})}));await p.goto(f.base+'/'+file+'?base=1');await p.waitForTimeout(300);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(100);
  const original=PNG.sync.read(await p.screenshot({path:path.join(out,file+'.base.png'),fullPage:true,animations:'disabled'}));let different=0;if(original.width===normalized.width&&original.height===normalized.height){for(let i=0;i<original.data.length;i+=4)if(!original.data.subarray(i,i+4).equals(normalized.data.subarray(i,i+4)))different++;}else different=-1;
  report.cases.push({file,status:different===0&&appErrors.length===0?'PASS':'FAIL',differentPixelsAfterContentNormalization:different,errors:appErrors,contentEdits:corrections.filter(r=>r.file==='frontend/'+file).length});fs.writeFileSync(path.join(out,'comparacion-parcial.json'),JSON.stringify(report,null,2));await c.close();
 }
 // Comprobar las tarjetas nuevas con los mismos estilos calculados, sin ocultar contenido.
 const p=await b.newPage({viewport:{width:1440,height:1000}});await p.addInitScript(()=>localStorage.setItem('datosVisionales',JSON.stringify({id_usuario:1,correo:'estudiante@example.test',nombre:'Estudiante QA',tipo_usuario:'estudiante'})));await p.route('**/api/**',r=>r.fulfill({json:{success:true,areas:{},estados:{},progreso:0}}));await p.goto(f.base+'/modulo-ciencias.html');await p.waitForFunction(()=>document.documentElement.dataset.learningReady==='true');
 for(const width of [1440,390]){await p.setViewportSize({width,height:1000});const style=await p.evaluate(()=>{const props=['fontFamily','fontSize','color','backgroundColor','borderTopWidth','borderTopColor','borderRadius','paddingTop','paddingLeft','display'];const signature=n=>Object.fromEntries(props.map(k=>[k,getComputedStyle(n)[k]]));const old=document.querySelector('#ej-0-0');return {old:signature(old),cards:[...document.querySelectorAll('[data-academico-nuevo].ejercicio-card')].map(n=>({id:n.id,style:signature(n)}))};});report.newCards.push({viewport:width,count:style.cards.length,status:style.cards.length===24&&style.cards.every(c=>JSON.stringify(c.style)===JSON.stringify(style.old))?'PASS':'FAIL'});}
 fs.writeFileSync(path.join(out,'comparacion.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.cases.some(c=>c.status!=='PASS')||report.newCards.some(c=>c.status!=='PASS'))process.exitCode=1;
 }finally{await b.close();await f.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
