const {test}=require('node:test'),assert=require('node:assert/strict');
const {validateImage}=require('../../backend/lib/images');
const {png,sharp}=require('../fixtures/images.cjs');
test('Imagen: decodifica PNG/JPEG/WebP y conserva dimensiones y píxeles PNG',async()=>{
 const source=await png();
 for(const format of ['png','jpeg','webp']){
  const input=await sharp(source)[format]().toBuffer();
  const result=await validateImage({buffer:input});assert.equal(result.type,'image/png');assert.equal(result.width,8);assert.equal(result.height,6);
  if(format==='png')assert.deepEqual(await sharp(result.buffer).raw().toBuffer(),await sharp(source).raw().toBuffer());
 }
 const result=await validateImage({buffer:Buffer.concat([source,Buffer.from('<script>private</script>')])});
 assert.equal(result.buffer.includes(Buffer.from('private')),false);
});
test('Imagen: rechaza cabeceras falsas, truncados, SVG, exceso y demasiados píxeles',async()=>{
 const source=await png(),webp=Buffer.alloc(16);webp.write('RIFF');webp.write('WEBP',8);
 const bomb=await sharp({create:{width:4001,height:4000,channels:3,background:'white'}}).png().toBuffer();
 for(const buffer of [Buffer.from([255,216,255,217]),webp,source.subarray(0,40),Buffer.from('<svg/>'),bomb])await assert.rejects(validateImage({buffer}),e=>e.status===400);
 await assert.rejects(validateImage({buffer:Buffer.alloc(2097153)}),e=>e.status===413);
});
