const path=require('node:path');
const config=require('./config');
const express=require('express');
const cors=require('cors');
const cookieParser=require('cookie-parser');
const rateLimit=require('./middlewares/rateLimit');
const csp=require('./lib/csp');
function createApp({pool,rateLimitOptions,accountLimitOptions,requestLimitOptions}={}){
 const app=express();app.disable('x-powered-by');
 app.locals.pool=pool || require('./db');
 app.locals.accountLimiter=require('./middlewares/accountLimit')(accountLimitOptions);
 app.use('/api',rateLimit({limit:1200,...requestLimitOptions}));
 app.use((req,res,next)=>{
  res.set('X-Content-Type-Options','nosniff').set('X-Frame-Options','DENY').set('Referrer-Policy','same-origin');
  if(config.production)res.set('Strict-Transport-Security','max-age=31536000; includeSubDomains');
  res.set('Content-Security-Policy',csp.policy());
  next();
 });
 app.use('/api',(req,res,next)=>{
  res.set('Cache-Control','no-store');
  const origin=req.headers.origin;
  const ownOrigin=req.protocol+'://'+req.get('host');
  if((origin && origin!==ownOrigin && !config.origins.includes(origin)) || req.headers['sec-fetch-site']==='cross-site')return res.status(403).json({success:false,mensaje:'Origen no autorizado.'});
  next();
 });
 app.use(cors({origin:(origin,cb)=>cb(null,!!origin&&config.origins.includes(origin)),credentials:true}));
 app.use(express.json({limit:'64kb'}));app.use(cookieParser());
 app.use((req,res,next)=>{req.body ||= {};next();});
 const authLimit=rateLimit({skipSuccessfulRequests:true,...rateLimitOptions});app.use(['/api/login','/api/registro'],authLimit);
 // Compatibilidad con clientes antiguos: integración retirada, sin invocar proveedores.
 app.post('/api/chat',(req,res)=>res.status(410).json({success:false,mensaje:'El asistente de IA fue excluido del alcance de PrepICFES.'}));
 app.get('/api/health',async(req,res)=>{
  try{await app.locals.pool.query('SELECT 1');res.json({status:'ok',database:'ok'});}
  catch{res.status(503).json({status:'degraded',database:'unavailable'});}
 });
 for(const name of ['auth','progreso','progresoAreas','clases','perfil','simulacros'])app.use('/api',require('./routes/'+name+'.routes'));
 app.use('/api',(req,res)=>res.status(404).json({success:false,mensaje:'Ruta no encontrada.'}));
 app.use('/uploads',rateLimit({limit:180}));
 app.get('/uploads/:nombre',require('./controllers/perfil.controller').obtenerFoto);
 // Conserva fotos hist?ricas locales; las nuevas se guardan en PostgreSQL.
 app.use('/uploads',(req,res,next)=>{
  if(!/\.(png|jpe?g|webp)$/i.test(req.path))return res.sendStatus(404);
  res.set('Content-Security-Policy',"default-src 'none'; sandbox");next();
 },express.static(path.join(__dirname,'uploads'),{dotfiles:'deny'}));
 app.use(express.static(path.join(__dirname,'../frontend'),{setHeaders:csp.staticHeaders}));
 app.use((error,req,res,next)=>{
  if(res.headersSent)return next(error);
  const tooLarge=error.code==='LIMIT_FILE_SIZE'||error.type==='entity.too.large';
  const bad=error instanceof SyntaxError || error.name==='MulterError';
  const status=tooLarge?413:bad?400:503;
  if(status===503)console.error('Solicitud fallida:',error.code || error.name || 'Error');
  res.status(status).json({success:false,mensaje:tooLarge?'Archivo o solicitud demasiado grande.':bad?'Solicitud inválida.':'Servicio temporalmente no disponible.'});
 });
 return app;
}
async function start(){
 const app=createApp();
 try{await app.locals.pool.query('SELECT 1');}catch(error){await app.locals.pool.end();throw error;}
 const server=app.listen(process.env.PORT||3000,()=>{console.log('PrepICFES en http://localhost:'+server.address().port);if(process.send)process.send({ready:true,port:server.address().port});});
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>app.locals.pool.end().then(()=>process.exit(0))));
 return server;
}
if(require.main===module)start().catch(error=>{console.error(error.message?.startsWith('Configuración PostgreSQL:')?error.message:'No se pudo iniciar: PostgreSQL no está disponible o rechazó la conexión.');process.exitCode=1;});
module.exports={createApp,start};
