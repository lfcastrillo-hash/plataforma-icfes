const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture}=require('../../tests/fixtures/app.cjs'),{browser}=require('./browser.cjs'),{png}=require('../../tests/fixtures/images.cjs');
(async()=>{
 const out=path.join(process.env.QA_EVIDENCE_ROOT,'imagen-browser');fs.mkdirSync(out,{recursive:true});
 const f=await fixture(),b=await browser();const report={date:new Date().toISOString(),cases:[]};
 try{
  const c=await b.newContext(),email='image-browser@example.test';await f.register(email);
  const r=await c.request.post(f.base+'/api/login',{data:{correo:email,password:'Prueba123!',rol:'estudiante'}}),login=await r.json();
  await c.addInitScript(user=>localStorage.setItem('datosVisionales',JSON.stringify({...user,tipo_usuario:user.rol})),login.usuario);
  const image=await png();const saved=await c.request.post(f.base+'/api/perfil/actualizar',{multipart:{foto:{name:'avatar.png',mimeType:'image/png',buffer:image}}});assert.equal(saved.status(),200);const data=await saved.json();
  const p=await c.newPage();await p.goto(f.base+'/perfil-estudiante.html');
  await p.waitForFunction(url=>[...document.images].some(i=>i.src.endsWith(url)&&i.complete&&i.naturalWidth===8),data.foto);
  await p.reload();await p.waitForFunction(url=>[...document.images].some(i=>i.src.endsWith(url)&&i.complete&&i.naturalHeight===6),data.foto);
  await p.screenshot({path:path.join(out,'perfil.png'),fullPage:true});
  const rejected=await c.request.post(f.base+'/api/perfil/actualizar',{multipart:{foto:{name:'fake.jpg',mimeType:'image/jpeg',buffer:Buffer.from([255,216,255,217])}}});assert.equal(rejected.status(),400);
  report.cases.push({status:'PASS',description:'Avatar real visible después de guardar y recargar; JPEG con cabecera falsa rechazado.'});
 }catch(e){report.cases.push({status:'FAIL',error:e.message});process.exitCode=1;}finally{await b.close();await f.close();fs.writeFileSync(path.join(out,'resultados.json'),JSON.stringify(report,null,2));}
})();
