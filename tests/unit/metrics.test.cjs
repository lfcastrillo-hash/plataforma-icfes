const {test}=require('node:test');const assert=require('node:assert/strict');
const {analyze}=require('../../scripts/metrics/measure.cjs');
test('QA métricas distinguen regex, cadenas, comentarios, funciones y clases reales',()=>{
 const s='// class Fake {}\nconst url="https://x"; // mixed\n\nclass Real { f(){return /a\\/b/.test("x");} }\n';
 const r=analyze(s,'fixture.js');assert.equal(r.PLOC,4);assert.equal(r.CLOC,1);assert.equal(r.NCLOC,2);assert.equal(r.BLOC,1);assert.equal(r.mixed,1);assert.equal(r.classes,1);assert.equal(r.functions,1);
 assert.equal(analyze('','empty.js').PLOC,0);
});
