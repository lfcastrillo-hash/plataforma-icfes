const fs=require('node:fs');const assert=require('node:assert/strict');
const {fixture}=require('../../tests/fixtures/app.cjs');const {browser}=require('./browser.cjs');
(async()=>{
 const f=await fixture(),b=await browser();const cases=[];
 const payload='<img src=x onerror="window.__qaXss=1">';
 try{
  for(const role of ['estudiante','profesor']){
   const email='xss-'+role+'@example.test';await f.register(email,role);const login=await f.login(email,role);
   await f.request('/perfil/actualizar',{method:'POST',cookie:login.cookie,body:{nombre:payload,biografia:payload}});
   // Simular una ruta histórica maliciosa que el API nuevo no permite crear.
   await f.pool.query('UPDATE usuarios SET foto_perfil=$1 WHERE email=$2',['/uploads/broken.png" onerror="window.__qaXss=1',email]);
   const context=await b.newContext();const raw=login.cookie.slice(login.cookie.indexOf('=')+1);
   await context.addCookies([{name:'token_acceso',value:decodeURIComponent(raw),url:f.base,httpOnly:true,sameSite:'Lax'}]);
   await context.addInitScript(user=>localStorage.setItem('datosVisionales',JSON.stringify({...user,tipo_usuario:user.rol})),login.data.usuario);
   const page=await context.newPage();
   for(const file of ['perfil-'+role+'.html',...(role==='estudiante'?['panel-estudiante.html']:[])]){
    await page.goto(f.base+'/'+file);
    await page.waitForFunction(()=>!!document.querySelector('img[src*="broken.png"]'));
    assert.equal(await page.evaluate(()=>window.__qaXss||0),0);
    assert.equal(await page.locator('[onerror]').count(),0);
    if(file.startsWith('perfil-')){
      assert.equal(await page.locator('#perfil-biografia img').count(),0);
      assert.ok((await page.locator('#perfil-biografia').textContent()).includes('<img'));
    }
    cases.push({file,status:'PASS',checks:'Biografía/nombre mostrados como texto; ruta histórica no crea atributo onerror ni ejecuta código'});
   }
   await context.close();
  }
  fs.mkdirSync('evidencias/sistema',{recursive:true});fs.writeFileSync('evidencias/sistema/xss-navegador.json',JSON.stringify({date:new Date().toISOString(),browser:b.version(),environment:'HTTP local y SQL WASM; payload benigno de prueba',cases},null,2));
  console.log('XSS navegador: '+cases.length+' páginas verificadas.');
 }finally{await b.close();await f.close();}
})();
