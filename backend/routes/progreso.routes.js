const router=require('express').Router();
const auth=require('../middlewares/verificarToken');
const {ownEmail,role}=require('../middlewares/access');
const c=require('../controllers/progreso.controller');
router.post('/progreso',auth,role('estudiante'),ownEmail,c.guardarProgreso);
router.get('/progreso/:correo',auth,role('estudiante'),ownEmail,c.obtenerProgreso);
router.get('/ranking',auth,role('profesor'),c.obtenerRanking);
module.exports=router;
