const { test } = require('node:test');
const assert = require('node:assert/strict');
const v = require('../../backend/lib/validation');
const { hashPassword, verifyPassword } = require('../../backend/lib/passwords');
const { validateState, progressFromState, general } = require('../../backend/lib/progress');
const { score, validConfig } = require('../../frontend/js/simulacro-core');
const { validAttempt } = require('../../frontend/js/simulacro-core');
const { imageType } = require('../../backend/controllers/perfil.controller');
for (const [value, expected] of [['',false],['x',false],['a@example.test',true],[' a@example.test ',true],['a@b',false],[null,false],['x'.repeat(255)+'@e.test',false]]) {
  test('M1-CE correo '+JSON.stringify(value).slice(0,45),()=>assert.equal(v.email(value),expected));
}
for (const n of [0,1,7,8,9,127,128,129]) test('M1-VL contraseña longitud '+n,()=>assert.equal(v.password('x'.repeat(n)),n>=8&&n<=128));
for (const n of [-1,0,0.1,99.9,100,101,NaN,Infinity,'50',null]) test('M2-VL porcentaje '+String(n),()=>assert.equal(v.percentage(n),typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100));
for (const n of [0,1,119,120,121]) test('M4/M5-VL nombre '+n,()=>assert.equal(v.text('x'.repeat(n),1,120),n>=1&&n<=120));
for (const n of [0,1,1999,2000,2001]) test('M5-VL biografía '+n,()=>assert.equal(v.text('x'.repeat(n),0,2000),n<=2000));
for (const n of [0,1,4999,5000,5001]) test('M4-VL anuncio '+n,()=>assert.equal(v.text('x'.repeat(n),0,5000),n<=5000));
for (const value of [0,-1,'abc','1 OR 1=1',1,'1',1.2,Number.MAX_SAFE_INTEGER+1]) test('M4-CE identificador '+value,()=>assert.equal(v.id(value),value===1||value==='1'));
test('M1-CB scrypt, sal única y verificación segura',async()=>{
  const a=await hashPassword(' prueba 123 '), b=await hashPassword(' prueba 123 ');
  assert.notEqual(a,b);assert.ok(a.startsWith('scrypt$'));assert.ok(await verifyPassword(' prueba 123 ',a));
  assert.equal(await verifyPassword('prueba 123',a),false);assert.equal(await verifyPassword('x','scrypt$invalid'),false);
  assert.equal(await verifyPassword('old','old'),false);assert.equal(await verifyPassword('old','old',true),true);
  assert.equal(await verifyPassword(null,a),false);assert.equal(await verifyPassword('x','different',true),false);
  assert.equal(await verifyPassword('x','scrypt$131072$8$1$invalid$invalid'),false);
});
test('M2-CB estado, duplicados y límites reales 5x8',()=>{
  assert.equal(validateState({correctas:{'0-0':true},completados:[]}),true);
  assert.equal(progressFromState({correctas:{'0-0':true}}),3);
  for(const state of [null,[],{correctas:null},{correctas:false},{correctas:[]},{completados:null},{correctas:{'5-0':true}},{correctas:{'0-8':true}},{correctas:{'0-0':false}},{completados:[0]},{completados:[1,1]}])assert.equal(validateState(state),false);
  const correctas=Object.fromEntries(Array.from({length:8},(_,i)=>['0-'+i,true]));
  assert.equal(validateState({correctas,completados:[0]}),true);
  assert.equal(general({matematicas:100}),20);assert.equal(general({}),0);
});
test('M3-CE/VL cero, todos, omitidos, repetidos y respuestas falsificadas',()=>{
  const q=[{area:'matematicas',correcta:1},{area:'ingles',correcta:0}];
  assert.throws(()=>score([],[],{}));
  assert.equal(score(q,[],{}).puntajeGlobal,0);
  assert.equal(score(q,[],{}).totalOmitidas,2);
  const r=score(q,[{idx:0,seleccionada:1},{idx:1,seleccionada:0}],{});
  assert.equal(r.puntajeGlobal,500);assert.equal(r.porcentaje,100);
  assert.equal(score(q,[{idx:0,seleccionada:0,correcta:true}],{}).totalCorrectas,0);
  assert.equal(score(q,[{idx:0,seleccionada:1},{idx:0,seleccionada:1}],{}).totalCorrectas,1);
  assert.equal(score(q,[{idx:0,seleccionada:1}],{}).puntajeGlobal,250);
});
test('M3-CB configuración válida y caminos inválidos',()=>{
  const banks={matematicas:[{tema:'a'}]};
  for(const c of [null,0,'x',{}, {tipo:'area',area:'bad'},{tipo:'temas',temas:null},{tipo:'temas',temas:[]},{tipo:'temas',temas:Array(26).fill({area:'matematicas',tema:'a'})},{tipo:'temas',temas:[null]},{tipo:'temas',temas:[{area:'bad',tema:'a'}]},{tipo:'temas',temas:[{area:'matematicas',tema:'bad'}]}])assert.equal(validConfig(c,banks),false);
  for(const c of [{tipo:'general'},{tipo:'area',area:'matematicas'},{tipo:'temas',temas:[{area:'matematicas',tema:'a'}]}])assert.equal(validConfig(c,banks),true);
});
test('M3-REANUDAR estado recuperable y cachés inválidas',()=>{
 const cfg={tipo:'area',area:'matematicas'},banks={matematicas:[{opciones:['A','B']}]};
 const state={config:JSON.stringify(cfg),ids:['matematicas:0'],idx:0,seconds:0,answers:[],selected:1,resultId:'12345678-1234-4123-8123-123456789012',finished:false};
 assert.equal(validAttempt(state,cfg,banks),true);
 assert.equal(validAttempt({...state,idx:1,selected:null,answers:[{idx:0,seleccionada:0}]},cfg,banks),true);
 for(const patch of [{ids:[]},{ids:['bad']},{ids:['matematicas:9']},{idx:-1},{seconds:-1},{selected:2},{resultId:'bad'},{idx:1,selected:null,answers:[{idx:0,seleccionada:2}]},{idx:1,selected:null,answers:[{idx:0,seleccionada:0},{idx:0,seleccionada:0}]}])assert.equal(validAttempt({...state,...patch},cfg,banks),false);
 assert.equal(validAttempt(null,cfg,banks),false);
});
test('M5-CE imágenes y archivos disfrazados',()=>{
  assert.equal(imageType(null),null);assert.equal(imageType({buffer:Buffer.from('<script>x</script>')}),null);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a23cAAAAASUVORK5CYII=','base64');
  assert.equal(imageType({buffer:png}),'image/png');
  assert.equal(imageType({buffer:Buffer.from([255,216,255,217])}),'image/jpeg');
  const jpg=Buffer.from([255,216,255,0,255,217]);
  for(const index of [0,1,2,4,5]){const bad=Buffer.from(jpg);bad[index]=0;assert.equal(imageType({buffer:bad}),null);}
  const webp=Buffer.alloc(16);webp.write('RIFF',0);webp.write('WEBP',8);assert.equal(imageType({buffer:webp}),'image/webp');
  for(const index of [0,8]){const bad=Buffer.from(webp);bad[index]=0;assert.equal(imageType({buffer:bad}),null);}
  const badPng=Buffer.from(png);badPng[12]=0;assert.equal(imageType({buffer:badPng}),null);
  assert.equal(imageType({buffer:Buffer.alloc(0)}),null);
});
