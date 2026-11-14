const OpenAI=require('openai');
const {text,fail}=require('../lib/validation');
async function chatIA(req,res){
 if(!text(req.body.mensaje,1,4000))return fail(res,400,'El mensaje debe tener entre 1 y 4000 caracteres.');
 if(!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL)return res.status(503).json({error:'El tutor no está configurado. Contacta al administrador.'});
 try{
  const client=req.app.locals.aiClient || new OpenAI({apiKey:process.env.OPENROUTER_API_KEY,baseURL:'https://openrouter.ai/api/v1',timeout:20000,maxRetries:0});
  const completion=await client.chat.completions.create({model:process.env.OPENROUTER_MODEL,messages:[{role:'system',content:'Eres un tutor educativo de preparación Saber 11 de Colombia. Explica en español con ejemplos y razonamiento en Matemáticas, Lectura Crítica, Ciencias, Sociales e Inglés.'},{role:'user',content:req.body.mensaje.trim()}],max_tokens:1000});
  const respuesta=completion.choices?.[0]?.message?.content;
  if(!respuesta)return res.status(502).json({error:'El proveedor no gener? una respuesta.'});
  res.json({respuesta});
 }catch(error){res.status(error.status===429?503:502).json({error:'El tutor no está disponible temporalmente. Intenta nuevamente.'});}
}
module.exports={chatIA};
