const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const acorn=require('acorn');
const Parser=acorn.Parser.extend(require('acorn-jsx')());
const extensions=new Set(['.html','.css','.js','.jsx','.cjs','.mjs','.sql']);
const excluded=new Set(['node_modules','uploads','dist','build','coverage','.git']);
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?excluded.has(e.name)?[]:files(path.join(dir,e.name)):extensions.has(path.extname(e.name))?[path.join(dir,e.name).replace(/\\/g,'/')]:[]).sort();}
function analyze(content,file){
 const s=content.replace(/\r\n?/g,'\n');const marks=new Uint8Array(s.length);const functions=[],classes=[];
 function mark(start,end){for(let i=start;i<end;i++)if(s[i]!=='\n')marks[i]=1;}
 const isFunction=n=>['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(n.type);
 function walk(n,parent){
  if(!n||typeof n!=='object')return;
  if(isFunction(n)){
   let complexity=1;
   function decisions(x){if(!x||typeof x!=='object')return;if(x!==n&&isFunction(x))return;
    if(['IfStatement','ConditionalExpression','ForStatement','ForInStatement','ForOfStatement','WhileStatement','DoWhileStatement','CatchClause','LogicalExpression'].includes(x.type)||(x.type==='SwitchCase'&&x.test))complexity++;
    for(const value of Object.values(x))if(Array.isArray(value))value.forEach(decisions);else if(value&&typeof value==='object')decisions(value);
   }decisions(n);
   functions.push({name:n.id?.name||parent?.id?.name||parent?.key?.name||'<callback>',line:(s.slice(0,n.start).match(/\n/g)||[]).length+1,complexity});
  }
  if(['ClassDeclaration','ClassExpression'].includes(n.type))classes.push({name:n.id?.name||'<anónima>',line:(s.slice(0,n.start).match(/\n/g)||[]).length+1});
  for(const v of Object.values(n))if(Array.isArray(v))v.forEach(x=>walk(x,n));else if(v&&typeof v==='object')walk(v,n);
 }
 function js(code,offset){const comments=[];const ast=Parser.parse(code,{ecmaVersion:'latest',sourceType:'module',onComment:comments});comments.forEach(c=>mark(offset+c.start,offset+c.end));
  function shift(n){if(!n||typeof n!=='object')return;if(typeof n.start==='number'){n.start+=offset;n.end+=offset;}for(const v of Object.values(n))if(Array.isArray(v))v.forEach(shift);else if(v&&typeof v==='object')shift(v);}
  shift(ast);walk(ast);
 }
 function blockComments(code,offset,sql=false){let quote=null;for(let i=0;i<code.length;i++){
  if(quote){if(code[i]==='\\'){i++;continue;}if(code[i]===quote){if(sql&&code[i+1]===quote){i++;continue;}quote=null;}continue;}
  if(code[i]==='"'||code[i]==="'"){quote=code[i];continue;}
  if(code.slice(i,i+2)==='/*'){const end=code.indexOf('*/',i+2);const z=end<0?code.length:end+2;mark(offset+i,offset+z);i=z-1;}
  else if(sql&&code.slice(i,i+2)==='--'){const end=code.indexOf('\n',i);const z=end<0?code.length:end;mark(offset+i,offset+z);i=z-1;}
 }}
 const ext=path.extname(file);
 if(['.js','.jsx','.cjs','.mjs'].includes(ext))js(s,0);
 else if(ext==='.html'){
  for(const match of s.matchAll(/<!--[\s\S]*?-->/g))mark(match.index,match.index+match[0].length);
  for(const match of s.matchAll(/<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/gi)){
   const offset=match.index+match[0].indexOf('>')+1;
   if(match[1].toLowerCase()==='script')js(match[2],offset);else blockComments(match[2],offset);
  }
 }else blockComments(s,0,ext==='.sql');
 const lines=s.endsWith('\n')?s.slice(0,-1).split('\n'):s?s.split('\n'):[];
 let pos=0,NCLOC=0,CLOC=0,BLOC=0,mixed=0;
 for(const line of lines){let code=false,comment=false;for(let i=0;i<line.length;i++)if(!/\s/.test(line[i])){if(marks[pos+i])comment=true;else code=true;}
  if(!line.trim())BLOC++;else if(code)NCLOC++;else if(comment)CLOC++;
  if(code&&comment)mixed++;pos+=line.length+1;
 }
 return {file,language:ext.slice(1),PLOC:lines.length,NCLOC,CLOC,BLOC,mixed,functions: functions.length,classes:classes.length,functionDetails:functions,classDetails:classes};
}
function measure({commit}={}){
 const paths=commit?execFileSync('git',['ls-tree','-r','--name-only',commit,'frontend','backend'],{encoding:'utf8'}).trim().split('\n').filter(f=>!f.split('/').some(p=>excluded.has(p))&&extensions.has(path.extname(f))):[...files('frontend'),...files('backend')];
 const hash=crypto.createHash('sha256');
 const rows=paths.map(f=>{const s=commit?execFileSync('git',['show',commit+':'+f],{encoding:'utf8',maxBuffer:10*1024*1024}):fs.readFileSync(f,'utf8');hash.update(f+'\n'+s.replace(/\r\n?/g,'\n'));return analyze(s,f);});
 const totals={files:rows.length,PLOC:0,NCLOC:0,CLOC:0,BLOC:0,mixed:0,functions:0,classes:0};
 for(const r of rows)for(const k of Object.keys(totals).filter(k=>k!=='files'))totals[k]+=r[k];
 totals.commentDensity=Number((totals.CLOC/(totals.CLOC+totals.NCLOC)*100||0).toFixed(2));
 if(totals.PLOC!==totals.NCLOC+totals.CLOC+totals.BLOC)throw new Error('PLOC inconsistente');
 return {date:new Date().toISOString(),version:require('../../package.json').version,commit:commit||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTree:!commit,sourceDirty:commit?false:!!execFileSync('git',['status','--porcelain','--','frontend','backend'],{encoding:'utf8'}).trim(),sourceSha256:hash.digest('hex'),node:process.version,scope:['frontend','backend'],exclusions:[...excluded],criteria:'PLOC=NCLOC+CLOC+BLOC; CLOC solo líneas exclusivamente de comentarios; mixtas incluidas en NCLOC. AST Acorn para JS/JSX e inline HTML. CSS/SQL escáner léxico. Funciones incluyen callbacks; complejidad=1+decisiones+operadores lógicos, excluye funciones anidadas. Clases AST reales.',totals,rows};
}
function exportReport(report,name){
 fs.mkdirSync('evidencias/metricas',{recursive:true});fs.writeFileSync('evidencias/metricas/'+name+'.json',JSON.stringify(report,null,2));
 const keys=['file','language','PLOC','NCLOC','CLOC','BLOC','mixed','functions','classes'];
 fs.writeFileSync('evidencias/metricas/'+name+'.csv',keys.join(',')+'\n'+report.rows.map(r=>keys.map(k=>JSON.stringify(r[k])).join(',')).join('\n')+'\n');
 console.log(name,report.totals);
}
if(require.main===module){exportReport(measure({commit:'c071262'}),'base-criterio-nuevo');exportReport(measure(),'actual');}
module.exports={analyze,measure,exportReport};
