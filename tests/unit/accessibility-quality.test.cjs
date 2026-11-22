const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {parse}=require('../../backend/node_modules/parse5');
function nodes(root){return (root.childNodes||[]).flatMap(n=>[n,...nodes(n)]);}
test('Accesibilidad: acciones nuevas tienen teclado y controles tienen nombre accesible',()=>{
 let keyboard=0,controls=0;
 for(const file of fs.readdirSync('frontend').filter(f=>f.endsWith('.html'))){
  for(const n of nodes(parse(fs.readFileSync('frontend/'+file,'utf8')))){
   const a=Object.fromEntries((n.attrs||[]).map(x=>[x.name,x.value]));
   if(a.role==='button'&&a.onclick&&a.onkeydown){assert.equal(a.tabindex,'0',file);assert.match(a.onkeydown,/Enter/);assert.match(a.onkeydown,/preventDefault/);keyboard++;}
   if(a['aria-label']&&['input','select','textarea'].includes(n.tagName)){assert.ok(a['aria-label'].trim(),file);controls++;}
  }
 }
 assert.ok(keyboard>0);assert.ok(controls>0);
});
