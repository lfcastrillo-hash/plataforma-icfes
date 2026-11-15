const {createHash}=require('node:crypto');
const {parse}=require('parse5');
const fs=require('node:fs');
const hash=value=>"'sha256-"+createHash('sha256').update(value).digest('base64')+"'";
function policy(html=''){
 const hashes=new Set();
 function walk(node){
  if(node.tagName==='script'&&!node.attrs.some(a=>a.name==='src')){
   const value=(node.childNodes||[]).map(n=>n.value||'').join('');if(value.trim())hashes.add(hash(value));
  }
  for(const a of node.attrs||[])if(a.name.startsWith('on'))hashes.add(hash(a.value));
  for(const child of node.childNodes||[])walk(child);
 }
 walk(parse(html));
 // Único handler generado por la tabla del profesor; el texto es estático.
 if(html.includes('js/panel-profesor.js'))hashes.add(hash('confirmarEliminarEstudiante(this.dataset.correo)'));
 return "default-src 'self'; script-src 'self'"+(hashes.size?" 'unsafe-hashes' "+[...hashes].join(' '):'')+"; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'";
}
function staticHeaders(res,file){if(file.endsWith('.html'))res.setHeader('Content-Security-Policy',policy(fs.readFileSync(file,'utf8')));}
module.exports={policy,staticHeaders,hash};
