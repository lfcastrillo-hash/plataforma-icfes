const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture}=require('../../tests/fixtures/app.cjs'),{browser}=require('./browser.cjs');
(async()=>{
 const out=path.join(process.env.QA_EVIDENCE_ROOT,'csp-browser');fs.mkdirSync(out,{recursive:true});
 const f=await fixture(),b=await browser();const report={date:new Date().toISOString(),cases:[]};
 try{
  const p=await b.newPage();const response=await p.goto(f.base+'/index.html');report.header=response.headers()['content-security-policy'];
  assert.equal(report.header.split(';').find(s=>s.includes('script-src')).includes('unsafe-inline'),false);
  await p.route('**/__qa-csp.js',route=>route.fulfill({contentType:'application/javascript',body:"try{new Function('window.injectedEval=1')();}catch{}window.evalChecked=true;"}));
  await p.evaluate(()=>{
   window.cspViolations=[];document.addEventListener('securitypolicyviolation',e=>window.cspViolations.push(e.effectiveDirective));
   const s=document.createElement('script');s.textContent='window.injectedScript=1';document.body.append(s);
   const b=document.createElement('button');b.setAttribute('onclick','window.injectedHandler=1');document.body.append(b);b.click();
   const external=document.createElement('script');external.src='/__qa-csp.js';document.body.append(external);
  });
  await p.waitForFunction(()=>window.evalChecked&&window.cspViolations.length>=3);
  const actual=await p.evaluate(()=>({script:!!window.injectedScript,handler:!!window.injectedHandler,eval:!!window.injectedEval,violations:window.cspViolations}));
  assert.equal(actual.script,false);assert.equal(actual.handler,false);assert.equal(actual.eval,false);
  // Handler legítimo de la aplicación sigue funcionando.
  await p.click('button[onclick="iniciarSesion()"]');
  await p.waitForFunction(()=>document.querySelector('#hero-login-form')?.textContent.includes('Completa todos los campos'));
  report.cases.push({status:'PASS',description:'Script, handler y eval no autorizados bloqueados; handler de login permitido.',actual});
 }catch(e){report.cases.push({status:'FAIL',error:e.message});process.exitCode=1;}finally{await b.close();await f.close();fs.writeFileSync(path.join(out,'resultados.json'),JSON.stringify(report,null,2));}
})();
