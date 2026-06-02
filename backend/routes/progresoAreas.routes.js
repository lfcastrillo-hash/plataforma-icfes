const express = require("express");

const {
  guardarProgresoArea,
  obtenerProgresoGeneral,
} = require("../controllers/progresoAreas.controller");

const router = express.Router();

router.post("/progreso-area", guardarProgresoArea);

router.get(
  "/progreso-general/:correo",
  obtenerProgresoGeneral
);

module.exports = router;