const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const perfilController = require("../controllers/perfil.controller");
const verificarToken = require("../middlewares/verificarToken");

// Crear la carpeta uploads automáticamente si no existe
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Rutas protegidas con verificarToken
router.get("/perfil/:correo", verificarToken, perfilController.obtenerPerfil);
router.post(
  "/perfil/actualizar",
  verificarToken,
  upload.single("foto"),
  perfilController.actualizarPerfil,
);

module.exports = router;
