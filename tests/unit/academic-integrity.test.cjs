const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {inventory}=require('../../scripts/qa/auditar-contenido.cjs');
test('AC01 cinco módulos: 25 temas, 200 preguntas, cuatro opciones distintas, feedback y navegación',()=>{
 const r=inventory();assert.deepEqual(r.issues,[]);assert.deepEqual(r.duplicates,[]);
 for(const m of r.modules){assert.equal(m.topics.length,5);assert.equal(m.nav.length,5);for(let t=0;t<5;t++){const topic=m.topics.find(s=>s.id==='tema-'+t);assert.equal(topic.exercises.length,8);assert.equal(topic.complete.length,1);assert.equal(topic.complete[0].action,'completarTema('+t+')');for(let e=0;e<8;e++){const q=topic.exercises[e];assert.equal(q.id,`ej-${t}-${e}`);assert.ok(q.feedback);for(const o of q.options)assert.match(o.handler,new RegExp(`responder\\(this,\\s*${t},\\s*${e},\\s*(true|false)\\)`));}}}
 assert.equal(r.bank.length,86);assert.equal(Object.values(r.configuration).reduce((s,a)=>s+a.nGeneral,0),85);
});
test('AC02 se conservan las claves válidas anteriores; solo se corrige la clave errónea autorizada',()=>{
 const before=inventory({baseCommit:'a28beb7cce3d03560424c52e613ead91d2f081af'}),after=inventory();
 for(const m of before.modules)for(const t of m.topics)for(const q of t.exercises){const a=after.modules.find(x=>x.area===m.area).topics.flatMap(x=>x.exercises).find(x=>x.id===q.id);const expected=m.area==='matematicas'&&q.id==='ej-1-5'?0:q.options.findIndex(o=>o.correct);assert.equal(a.options.findIndex(o=>o.correct),expected,m.area+'/'+q.id);}
 for(let i=0;i<before.bank.length;i++)assert.equal(after.bank[i].correcta,before.bank[i].correcta);
});
test('AC03 CSS, estilos inline e imágenes existentes conservados',()=>{
 for(const name of fs.readdirSync('frontend').filter(f=>f.endsWith('.html'))){const p='frontend/'+name,a=fs.readFileSync(p,'utf8').replace(/\r/g,''),b=execFileSync('git',['show','a28beb7:'+p],{encoding:'utf8'}).replace(/\r/g,'');assert.deepEqual([...a.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/g)].map(m=>m[0]),[...b.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/g)].map(m=>m[0]),p);assert.deepEqual([...a.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]),[...b.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]),p);}
 for(const file of fs.readdirSync('frontend/css'))assert.equal(fs.readFileSync('frontend/css/'+file,'utf8').replace(/\r/g,''),execFileSync('git',['show','a28beb7:frontend/css/'+file],{encoding:'utf8'}).replace(/\r/g,''));
});
test('AC04 soluciones numéricas nuevas y correcciones algebraicas comprobadas de forma independiente',()=>{
 const r=inventory(),questions=area=>r.modules.find(m=>m.area===area).topics.flatMap(t=>t.exercises),correct=q=>q.options.find(o=>o.correct).text.replace(/^[A-D]\)\s*/,'');
 const numeric=s=>Number(s.match(/-?\d+(?:[,.]\d+)?/)[0].replace(',','.'));
 const sci=questions('ciencias');for(const [id,value] of Object.entries({'ej-2-3':5+3,'ej-2-5':15/(15+135)*100,'ej-2-6':.20/.50,'ej-3-0':12/4,'ej-3-1':12/3,'ej-3-2':10*2,'ej-3-3':2*10*3,'ej-3-5':12/6,'ej-3-6':100*4.2*(25-20),'ej-3-7':20/5,'ej-4-1':20000*.1*.1,'ej-4-4':60/6*120}))assert.equal(numeric(correct(sci.find(q=>q.id===id))),value,id);
 const balanced=sci.find(q=>q.id==='ej-2-2');const solutions=balanced.options.map(o=>o.text.slice(3).match(/\d+/g).map(Number)).map(([a,b,c,d])=>a===c&&4*a===2*d&&2*b===2*c+d);assert.equal(solutions.filter(Boolean).length,1);assert.equal(solutions[balanced.options.findIndex(o=>o.correct)],true);
 const math=questions('matematicas'),system=correct(math.find(q=>q.id==='ej-1-3')).match(/x=(\d+)\/(\d+), y=(\d+)\/(\d+)/);const x=Number(system[1])/Number(system[2]),y=Number(system[3])/Number(system[4]);assert.ok(Math.abs(3*x-y-5)<1e-12);assert.ok(Math.abs(x+2*y-8)<1e-12);
 const answer=numeric(correct(math.find(q=>q.id==='ej-1-5')));assert.equal((answer+3)**2-(answer-1)**2,24);
 const perms=new Set();const walk=(prefix,left)=>{if(!left.length)return perms.add(prefix);left.forEach((l,i)=>walk(prefix+l,left.slice(0,i).concat(left.slice(i+1))));};walk('',['M','A','M','A']);assert.equal(numeric(correct(math.find(q=>q.id==='ej-3-7'))),perms.size);
});
