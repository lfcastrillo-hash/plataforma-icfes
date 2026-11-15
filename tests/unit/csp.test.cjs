const {test}=require('node:test'),assert=require('node:assert/strict');
const {policy,hash}=require('../../backend/lib/csp');
test('CSP autoriza hashes exactos de scripts y handlers normalizados por HTML',()=>{
 const csp=policy('<script>const x=1;\r\n</script><button onclick="x(&quot;a&quot;)">x</button>');
 assert.ok(csp.includes(hash('const x=1;\n')));assert.ok(csp.includes(hash('x("a")')));
 const script=csp.split(';').find(v=>v.includes('script-src'));assert.equal(script.includes('unsafe-inline'),false);assert.equal(script.includes('unsafe-eval'),false);
 assert.ok(csp.includes("object-src 'none'"));
});
