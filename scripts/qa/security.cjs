const fs=require('node:fs');const path=require('node:path');
const {spawnSync}=require('node:child_process');
const roots=['backend','frontend','scripts','tests','docs'];
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?['node_modules','uploads'].includes(e.name)?[]:files(path.join(dir,e.name)):/\.(js|cjs|mjs|jsx|html|sql|md|json|ya?ml|jmx)$/.test(e.name)?[path.join(dir,e.name)]:[]);}
const findings=[];const patterns=[['api-key',/\b(?:sk-(?:or-v1-)?[A-Za-z0-9_-]{25,}|AIza[A-Za-z0-9_-]{30,})\b/],['jwt-literal',/\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/],['old-jwt-secret',new RegExp(['icfes','secreto','123','ultra','seguro'].join('_'))]];
for(const file of roots.flatMap(files)){const text=fs.readFileSync(file,'utf8');for(const [rule,pattern]of patterns)if(pattern.test(text))findings.push({file,rule});}
const npmCli=process.env.npm_execpath || path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
function audit(prefix){
 const args=[...(prefix?['--prefix',prefix]:[]),'audit','--json'];
 const r=fs.existsSync(npmCli)?spawnSync(process.execPath,[npmCli,...args],{encoding:'utf8',env:process.env}):spawnSync('npm',args,{encoding:'utf8',env:process.env});
 let data;try{data=JSON.parse(r.stdout);}catch{return {status:'PENDING',reason:'No se obtuvo reporte JSON de npm'};}
 return {exitCode:r.status,vulnerabilities:data.metadata?.vulnerabilities,error:data.error?.summary};
}
const report={date:new Date().toISOString(),scope:'Fuentes propias; patrones de claves/JWT y secreto anterior. No sustituye revisión manual ni ZAP.',findings,root:audit(),backend:audit('backend')};
fs.mkdirSync('evidencias/sistema',{recursive:true});fs.writeFileSync('evidencias/sistema/seguridad.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
if(findings.length||report.root.exitCode!==0||report.backend.exitCode!==0)process.exitCode=1;
