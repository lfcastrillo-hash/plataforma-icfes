const rateLimit=require('./rateLimit');
module.exports=function accountLimit(options={}){
 const key=req=>String(req.usuario.id_usuario);
 const read=rateLimit({limit:600,key,...options.read});
 const learning=rateLimit({limit:240,key,...options.learning});
 const write=rateLimit({limit:120,key,...options.write});
 const profile=rateLimit({limit:12,key,...options.profile});
 return (req,res,next)=>{
  const limiter=req.method==='GET'?read:req.path==='/perfil/actualizar'?profile:req.path==='/progreso-area'?learning:write;
  return limiter(req,res,next);
 };
};
