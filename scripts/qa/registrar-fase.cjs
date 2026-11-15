const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const out=process.env.QA_EVIDENCE_ROOT;
if(!out || !path.resolve(out).startsWith(path.resolve('evidencias/estabilizacion-seguridad-20261114')+path.sep))throw new Error('Configure QA_EVIDENCE_ROOT dentro de la carpeta nueva, por fase.');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const protectedInventory=JSON.parse(fs.readFileSync('evidencias/estabilizacion-seguridad-20261114/referencia-protegida.json'));
const changed=Object.entries(protectedInventory.files).filter(([file,hash])=>!fs.existsSync(file)||sha(fs.readFileSync(file))!==hash).map(([file])=>file);
const files={};
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','uploads','.git'].includes(e.name))continue;const file=path.join(dir,e.name);if(e.isDirectory())walk(file);else if(!e.name.startsWith('.env'))files[file.replace(/\\/g,'/')]=sha(fs.readFileSync(file));}}
for(const dir of ['frontend','backend','tests','scripts'])walk(dir);
for(const file of ['package.json','package-lock.json'])files[file]=sha(fs.readFileSync(file));
const result={date:new Date().toISOString(),baseCommit:protectedInventory.baseCommit,currentHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),uncommitted:true,node:process.version,phase:out,sourceSha256:sha(Buffer.from(JSON.stringify(files))),files,protectedEvidenceFiles:Object.keys(protectedInventory.files).length,changedProtectedEvidence:changed};
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'contexto-fase.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({phase:out,sourceSha256:result.sourceSha256,protected:result.protectedEvidenceFiles,changed}));if(changed.length)process.exitCode=1;
