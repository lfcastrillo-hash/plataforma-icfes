const fs=require('node:fs');
const { execFileSync }=require('node:child_process');
const vm=require('node:vm');
const acorn=require('acorn');
const base=process.env.QA_BASE_COMMIT||'c071262';
const report={date:new Date().toISOString(),base,checks:[],pendingResources:[]};
function check(id,pass,detail){report.checks.push({id,status:pass?'PASS':'FAIL',detail});}
function original(file){return execFileSync('git',['show',base+':'+file],{encoding:'utf8',maxBuffer:10*1024*1024});}
function markup(html){return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/ rel="noopener noreferrer"/g,'').replace(/mostrarTab\('([^']+)', event\)/g,"mostrarTab('$1')").replace(/\r/g,'').replace(/>\s+</g,'><').trim();}
function expectedHtml(file){
 let s=original(file);
 if(file==='frontend/simulacro-selector.html')s=s.replace(/Examen completo de 85 preguntas distribuidas tal como el ICFES real\.\s*Calificado en escala de 0 a 500 puntos por área, con puntaje global\./,
 'Práctica de 85 preguntas en cinco áreas. Resultados por área de 0 a 100\n          y puntaje global de práctica de 0 a 500; no equivale a la calificación oficial.').replace(/<td>500<\/td>/g,'<td>100</td>');
 return s;
}
for(const name of fs.readdirSync('frontend').filter(f=>f.endsWith('.html'))){
 const file='frontend/'+name,s=fs.readFileSync(file,'utf8');check('HTML-'+name,markup(s)===markup(expectedHtml(file)),'Estructura/estilos/contenido conservados. Única excepción explícita: descripción y cinco máximos de escala corregidos en selector; se excluyen scripts y rel.');
 for(const m of s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){try{acorn.parse(m[1],{ecmaVersion:'latest'});}catch(e){check('JS-inline-'+name,false,e.message);}}
 for(const m of s.matchAll(/(?:src|href)="([^"#]+)"/g)){
  const target=m[1];if(/^(?:https?:|data:|javascript:)/.test(target))continue;
  if(!fs.existsSync('frontend/'+target.split('?')[0]))report.pendingResources.push({page:name,target});
 }
}
for(const file of fs.readdirSync('frontend/css'))check('CSS-'+file,fs.readFileSync('frontend/css/'+file,'utf8').replace(/\r/g,'')===original('frontend/css/'+file).replace(/\r/g,''),'Contenido idéntico; se normalizan solo finales CRLF/LF de Git en Windows');
const old=original('frontend/simulacro-nuevo.html');const a=old.indexOf('const BANCOS ='),z=old.indexOf('// ESTADO',a);
const context={};vm.createContext(context);vm.runInContext(old.slice(a,z)+';this.bank=BANCOS;this.cfg=CONFIG_AREAS;',context);
const bank=require('../../frontend/js/banco-simulacro');
check('BANCO-SIMULACRO',JSON.stringify(context.bank)===JSON.stringify(bank.BANCOS)&&JSON.stringify(context.cfg)===JSON.stringify(bank.CONFIG_AREAS),'Preguntas, opciones, respuestas, explicaciones y configuración conservadas al extraerlas a módulo compartido');
for(const area of ['matematicas','lectura','ciencias','sociales','ingles']){
 const s=fs.readFileSync('frontend/modulo-'+area+'.html','utf8');
 const keys=[...s.matchAll(/id="ej-(\d)-(\d)"/g)].map(m=>m[1]+'-'+m[2]);
 const options=[...s.matchAll(/onclick="responder\(\s*this,\s*(\d),\s*(\d),\s*(true|false)\s*\)"/g)];
 check('OPCIONES-'+area,new Set(keys).size===keys.length&&keys.every(k=>{
  const opts=options.filter(o=>o[1]+'-'+o[2]===k);
  return opts.length===4&&opts.filter(o=>o[3]==='true').length===1&&s.includes('id="fb-'+k+'"');
 }),'Cada ejercicio tiene cuatro opciones, una marcada correcta y feedback asociado');
 report.checks.push({id:'EJERCICIOS-'+area,status:'INFO',count:keys.length,missingAgainstDeclared40:40-keys.length});
}
check('OPCIONES-BANCO',Object.values(bank.BANCOS).flat().every(p=>Number.isInteger(p.correcta)&&p.correcta>=0&&p.correcta<p.opciones.length),'Índices de respuestas correctas dentro de opciones');
const selector=fs.readFileSync('frontend/simulacro-selector.html','utf8');
report.emptyTopics=[...selector.matchAll(/data-area="([^"]+)"\s+data-tema="([^"]+)"/g)].filter(m=>!bank.BANCOS[m[1]]?.some(p=>p.tema===m[2])).map(m=>({area:m[1],tema:m[2]}));
report.questionCounts=Object.fromEntries(Object.entries(bank.BANCOS).map(([a,b])=>[a,b.length]));
fs.mkdirSync('evidencias/integracion',{recursive:true});fs.writeFileSync('evidencias/integracion/integridad-estatica.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));if(report.checks.some(c=>c.status==='FAIL'))process.exitCode=1;
