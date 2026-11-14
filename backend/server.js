const path=require('node:path');
const config=require('./config');
const express=require('express');
const cors=require('cors');
const cookieParser=require('cookie-parser');
const rateLimit=require('./middlewares/rateLimit');
function createApp({pool,aiClient,rateLimitOptions}={}){
 const app=express();app.disable('x-powered-by');
 app.locals.pool=pool || require('./db');app.locals.aiClient=aiClient;
 app.use((req,res,next)=>{
  res.set('X-Content-Type-Options','nosniff').set('X-Frame-Options','DENY').set('Referrer-Policy','same-origin');
  if(config.production)res.set('Strict-Transport-Security','max-age=31536000; includeSubDomains');
  // El HTML actual usa handlers inline. CSP los permite conservando el dise?o.
  res.set('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
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
 const authLimit=rateLimit(rateLimitOptions);app.use(['/api/login','/api/registro','/api/chat'],authLimit);
 app.get('/api/health',async(req,res)=>{
  try{await app.locals.pool.query('SELECT 1');res.json({status:'ok',database:'ok'});}
  catch{res.status(503).json({status:'degraded',database:'unavailable'});}
 });
 for(const name of ['auth','progreso','progresoAreas','clases','perfil','ia','simulacros'])app.use('/api',require('./routes/'+name+'.routes'));
 app.use('/api',(req,res)=>res.status(404).json({success:false,mensaje:'Ruta no encontrada.'}));
 app.get('/uploads/:nombre',require('./controllers/perfil.controller').obtenerFoto);
 // Conserva fotos hist?ricas locales; las nuevas se guardan en PostgreSQL.
 app.use('/uploads',(req,res,next)=>{
  if(!/\.(png|jpe?g|webp)$/i.test(req.path))return res.sendStatus(404);
  res.set('Content-Security-Policy',"default-src 'none'; sandbox");next();
 },express.static(path.join(__dirname,'uploads'),{dotfiles:'deny'}));
 app.use(express.static(path.join(__dirname,'../frontend')));
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
if(require.main===module){
 const app=createApp();const server=app.listen(process.env.PORT||3000,()=>console.log('PrepICFES en http://localhost:'+(process.env.PORT||3000)));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>app.locals.pool.end().then(()=>process.exit(0))));
}
module.exports={createApp};
