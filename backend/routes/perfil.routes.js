const router=require('express').Router();
const multer=require('multer');
const auth=require('../middlewares/verificarToken');
const {ownEmail}=require('../middlewares/access');
const c=require('../controllers/perfil.controller');
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:2*1024*1024,files:1,fields:6,fieldSize:8192}});
router.get('/perfil/:correo',auth,ownEmail,c.obtenerPerfil);
router.post('/perfil/actualizar',auth,upload.single('foto'),c.actualizarPerfil);
module.exports=router;
