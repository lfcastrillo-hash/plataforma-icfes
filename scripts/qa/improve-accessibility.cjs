// Modificación semántica localizada: conserva texto, estilos, imágenes y handlers.
const fs=require('node:fs'),{parse}=require('../../backend/node_modules/parse5');
const interactive=new Set(['button','input','select','textarea','a']);
function text(node){return node.value||(node.childNodes||[]).map(text).join(' ');}
function descendants(node){return (node.childNodes||[]).flatMap(n=>[n,...descendants(n)]);}
for(const file of fs.readdirSync('frontend').filter(f=>f.endsWith('.html'))){
 const name='frontend/'+file,source=fs.readFileSync(name,'utf8'),root=parse(source,{sourceCodeLocationInfo:true}),changes=[];
 for(const node of descendants(root)){
  const loc=node.sourceCodeLocation?.startTag;if(!loc)continue;
  const attrs=Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));let extra='';
  if(['input','select','textarea'].includes(node.tagName)&&attrs.type!=='hidden'&&!attrs['aria-label']&&!attrs['aria-labelledby']){
   const label=(attrs.placeholder||attrs.name||attrs.id||'Campo del formulario').replace(/[&"<>]/g,' ');
   extra+=' aria-label="'+label+'"';
  }
  if(node.tagName==='label'&&!attrs.for){
   const target=descendants(node.parentNode).find(n=>['input','select','textarea'].includes(n.tagName)&&n.sourceCodeLocation?.startOffset>node.sourceCodeLocation.endOffset&&n.attrs.some(a=>a.name==='id'));
   if(target)extra+=' for="'+target.attrs.find(a=>a.name==='id').value+'"';
  }
  if(attrs.onclick&&!interactive.has(node.tagName)&&!attrs.role&&!descendants(node).some(n=>interactive.has(n.tagName))){
   extra+=' role="button" tabindex="0"';
   if(!attrs.onkeydown)extra+=' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.click();}"';
  }
  if(extra)changes.push({offset:loc.endOffset-(source[loc.endOffset-2]==='/'?2:1),extra});
 }
 let updated=source;
 for(const c of changes.sort((a,b)=>b.offset-a.offset))updated=updated.slice(0,c.offset)+c.extra+updated.slice(c.offset);
 if(changes.length)fs.writeFileSync(name,updated);
 console.log(file,changes.length);
}
