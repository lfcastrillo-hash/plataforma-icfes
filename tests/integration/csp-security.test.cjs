const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{fixture}=require('../fixtures/app.cjs');
test('SEC CSP de las 20 páginas: sin unsafe-inline/eval para scripts; API restrictiva',async()=>{
 const f=await fixture();try{
  for(const file of fs.readdirSync('frontend').filter(n=>n.endsWith('.html'))){
   const r=await fetch(f.base+'/'+file);assert.equal(r.status,200,file);const csp=r.headers.get('content-security-policy');
   const script=csp.split(';').find(s=>s.includes('script-src'));assert.ok(script);assert.equal(script.includes('unsafe-inline'),false,file);assert.equal(script.includes('unsafe-eval'),false,file);assert.ok(csp.length<16000,file);assert.ok(csp.includes("object-src 'none'"));
  }
  const r=await f.request('/health');assert.ok(r.headers.get('content-security-policy').includes("script-src 'self';"));
 }finally{await f.close();}
});
