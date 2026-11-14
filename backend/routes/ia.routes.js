const router=require('express').Router();
const auth=require('../middlewares/verificarToken');
const {chatIA}=require('../controllers/ia.controller');
router.post('/chat',auth,chatIA);
module.exports=router;
