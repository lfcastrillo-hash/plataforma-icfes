const sharp=require('sharp');
function imageType(file){
 if(!file)return null;const b=file.buffer;
 if(b.length>=24&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&b.toString('ascii',12,16)==='IHDR')return 'image/png';
 if(b.length>=4&&b[0]===255&&b[1]===216&&b[2]===255&&b.at(-2)===255&&b.at(-1)===217)return 'image/jpeg';
 if(b.length>=16&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP')return 'image/webp';
 return null;
}
async function validateImage(file){
 if(!file)return null;
 if(file.buffer.length>2*1024*1024)throw Object.assign(new Error('Imagen demasiado grande.'),{status:413});
 try{
  const type=imageType(file);if(!type)throw new Error('signature');
  const image=sharp(file.buffer,{failOn:'warning',limitInputPixels:16000000});
  const meta=await image.metadata();
  if('image/'+meta.format!==type||!meta.width||!meta.height||(meta.pages||1)>1)throw new Error('format');
  // Decodificación completa y reencodificación: elimina metadatos y contenido añadido.
  const {data,info}=await image.rotate().resize({width:1024,height:1024,fit:'inside',withoutEnlargement:true}).png().toBuffer({resolveWithObject:true});
  if(data.length>5*1024*1024)throw new Error('output');
  return {buffer:data,type:'image/png',width:info.width,height:info.height};
 }catch{throw Object.assign(new Error('Solo se permiten imágenes PNG, JPEG o WebP con contenido válido, no animadas y de hasta 16 megapíxeles.'),{status:400});}
}
module.exports={imageType,validateImage};
