const rateLimit=require('./rateLimit');
module.exports=function accountLimit(options={}){
 const key=req=>String(req.usuario.id_usuario);
 const read=rateLimit({limit:600,key,...options.read});
 const learning=rateLimit({limit:240,key,...options.learning});
 const write=rateLimit({limit:120,key,...options.write});
 const profile=rateLimit({limit:12,key,...options.profile});
 return (req,res,next)=>{
  let limiter = write;
  if (req.method === 'GET') limiter = read;
  else if (req.path === '/perfil/actualizar') limiter = profile;
  else if (req.path === '/progreso-area') limiter = learning;
  return limiter(req,res,next);
 };
};
