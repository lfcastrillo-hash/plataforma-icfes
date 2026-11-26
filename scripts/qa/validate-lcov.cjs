const fs=require('node:fs'),path=require('node:path');
function validate(file,root=process.cwd()){
 const text=fs.readFileSync(file,'utf8');let files=0,lines=0;
 for(const record of text.split('end_of_record')){
  const match=/^SF:(.+)$/m.exec(record);if(!match)continue;
  const filename=match[1].trim(),resolved=path.resolve(root,filename);
  if(!resolved.startsWith(path.resolve(root)+path.sep)||!fs.existsSync(resolved))throw Error('Ruta LCOV no válida: '+filename);
  const count=fs.readFileSync(resolved,'utf8').split(/\r?\n/).length;
  const seen=new Set();
  for(const m of record.matchAll(/^DA:(\d+),(\d+)$/gm)){
   const line=Number(m[1]);if(line<1||line>count||seen.has(line))throw Error('Línea LCOV no válida: '+filename);seen.add(line);lines++;
  }
  if(!seen.size)throw Error('Sin medidas de líneas: '+filename);files++;
 }
 if(!files||!lines)throw Error('LCOV vacío');
 return {files,lines,scope:'Solo archivos ejecutados; no es cobertura de todo el producto. LCOV disponible por línea, sin ramas ni funciones.'};
}
if(require.main===module)console.log(JSON.stringify(validate(process.argv[2]),null,2));
module.exports={validate};
