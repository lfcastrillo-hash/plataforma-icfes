const express = require("express");
const router = express.Router();
const multer = require("multer");
const perfilController = require("../controllers/perfil.controller");
const verificarToken = require("../middlewares/verificarToken"); // <-- IMPORTAMOS EL MIDDLEWARE

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, "uploads/"); },
  filename: function (req, file, cb) { cb(null, Date.now() + "-" + file.originalname); }
});
const upload = multer({ storage: storage });

// Protegemos las rutas con verificarToken
router.get("/perfil/:correo", verificarToken, perfilController.obtenerPerfil);
router.post("/perfil/actualizar", verificarToken, upload.single("foto"), perfilController.actualizarPerfil);

module.exports = router;