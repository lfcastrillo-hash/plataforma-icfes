const router=require('express').Router();
const {registrar,login,logout}=require('../controllers/auth.controller');
const auth=require('../middlewares/verificarToken');
router.post('/registro',registrar);router.post('/login',login);router.post('/logout',auth,logout);
module.exports=router;
