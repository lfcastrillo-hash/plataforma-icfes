const express = require("express");
const { registrar, login, logout } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/registro", registrar);
router.post("/login", login);
router.post("/logout", logout); // <-- NUEVA: Ruta para cerrar sesión

module.exports = router;