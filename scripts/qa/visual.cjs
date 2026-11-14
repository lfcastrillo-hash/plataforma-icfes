const fs=require('node:fs');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const { PNG }=require('pngjs');
const { browser }=require('./browser.cjs');
const { fixture }=require('../../tests/fixtures/app.cjs');
async function run(){
  const f=await fixture(), b=await browser();
  const dir='evidencias/capturas-visuales/final';fs.mkdirSync(dir,{recursive:true});
  const report={date:new Date().toISOString(),environment:'Chrome headless 1440x1000; API interceptada exclusivamente para comparación visual',cases:[],css:[]};
  try{
    for(const file of fs.readdirSync('frontend').filter(f=>f.endsWith('.html'))){
      const context=await b.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
      await context.addInitScript(({prof})=>{localStorage.setItem('datosVisionales',JSON.stringify({id_usuario:prof?2:1,correo:prof?'profesor@example.test':'estudiante@example.test',nombre:prof?'Profesor QA':'Estudiante QA',tipo_usuario:prof?'profesor':'estudiante'}));sessionStorage.setItem('simulacro_config',JSON.stringify({tipo:'area',area:'matematicas'}));Math.random=()=>0.5;},{prof:/profesor|clases\.html/.test(file)});
      const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/api/**',route=>{
        const url=route.request().url(),prof=/profesor|clases\.html/.test(file);
        let data={success:true,clases:[],anuncios:[],areas:{},progreso:0};
        if(url.includes('/perfil/'))data={id_usuario:prof?2:1,nombre:prof?'Profesor QA':'Estudiante QA',email:prof?'profesor@example.test':'estudiante@example.test',rol:prof?'profesor':'estudiante',foto_perfil:null,biografia:'',lista_clases:[]};
        // Antes la pantalla histórica tenía este registro estático; ahora se obtiene por API.
        if(file==='clases.html'&&url.includes('/clases'))data.clases=[{nombre_clase:'Matemáticas 11A',codigo_acceso:'ICFES11A'}];
        return route.fulfill({json:data});
      });
      await page.goto(f.base+'/'+file);await page.waitForTimeout(300);
      await page.screenshot({path:dir+'/'+file+'.png',fullPage:true,animations:'disabled'});
      const a=PNG.sync.read(fs.readFileSync('evidencias/capturas-visuales/inicial/'+file+'.png'));
      const z=PNG.sync.read(fs.readFileSync(dir+'/'+file+'.png'));
      let differentPixels=null;
      if(a.width===z.width&&a.height===z.height){differentPixels=0;for(let i=0;i<a.data.length;i+=4)if(!a.data.subarray(i,i+4).equals(z.data.subarray(i,i+4)))differentPixels++;}
      let expectedCorrection;
      if(file==='simulacro-selector.html'){
        const selectors=['.card-general > p:first-of-type',...Array.from({length:5},(_,i)=>'.tabla-areas tbody tr:nth-child('+(i+1)+') td:nth-child(3)')];
        const geometry=async()=>Promise.all(['.card-general','.tabla-areas','.btn-iniciar',...selectors].map(s=>page.locator(s).first().boundingBox()));
        const finalGeometry=await geometry();
        const regions=await Promise.all(selectors.map(s=>page.locator(s).boundingBox()));
        const original=execFileSync('git',['show','c071262:frontend/'+file],{encoding:'utf8'});
        await page.route('**/simulacro-selector.html*',r=>r.fulfill({contentType:'text/html',body:original}));
        await page.goto(f.base+'/'+file+'?reference=original');await page.waitForTimeout(300);
        const initialGeometry=await geometry();
        const reference=PNG.sync.read(await page.screenshot({fullPage:true,animations:'disabled'}));
        const baselineMatches=reference.data.equals(a.data);
        let outside=0;
        if(a.width===z.width&&a.height===z.height)for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){
          const offset=(y*a.width+x)*4;
          if(!a.data.subarray(offset,offset+4).equals(z.data.subarray(offset,offset+4))&&!regions.some(r=>r&&x>=Math.floor(r.x)-1&&x<=Math.ceil(r.x+r.width)+1&&y>=Math.floor(r.y)-1&&y<=Math.ceil(r.y+r.height)+1))outside++;
        }
        expectedCorrection={reason:'Texto de práctica y cinco escalas por área:100 en lugar de500; estilos y estructura sin cambios',regions,geometryStable:JSON.stringify(finalGeometry)===JSON.stringify(initialGeometry),baselineMatches,differentPixelsOutsideText:outside};
      }
      const pass=(differentPixels===0 || (expectedCorrection?.geometryStable&&expectedCorrection.baselineMatches&&expectedCorrection.differentPixelsOutsideText===0))&&!errors.length;
      report.cases.push({file,width:z.width,height:z.height,differentPixels,errors,...(expectedCorrection?{expectedCorrection}:{}),status:pass?'PASS':'REVIEW'});
      await context.close();
    }
    const initial=JSON.parse(fs.readFileSync('evidencias/capturas-visuales/inicial/manifest.json'));
    report.css=initial.css.map(c=>({...c,unchanged:crypto.createHash('sha256').update(fs.readFileSync('frontend/css/'+c.file)).digest('hex')===c.sha256}));
    fs.writeFileSync('evidencias/capturas-visuales/comparacion.json',JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
    if(report.cases.some(c=>c.status!=='PASS')||report.css.some(c=>!c.unchanged))process.exitCode=1;
  }finally{await b.close();await f.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
