const router=require('express').Router();
const auth=require('../middlewares/verificarToken');
const {ownEmail,role}=require('../middlewares/access');
const c=require('../controllers/progresoAreas.controller');
const student=[auth,role('estudiante'),ownEmail];
router.post('/progreso-area',...student,c.guardarProgresoArea);
router.get('/progreso-general/:correo',...student,c.obtenerProgresoGeneral);
router.get('/progreso-areas/:correo',...student,c.obtenerProgresoAreas);
module.exports=router;
