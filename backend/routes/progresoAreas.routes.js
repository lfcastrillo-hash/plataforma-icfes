const express = require("express");

const {
  guardarProgresoArea,
  obtenerProgresoGeneral,
  obtenerProgresoAreas,
} = require("../controllers/progresoAreas.controller");

const router = express.Router();

router.post("/progreso-area", guardarProgresoArea);
router.get("/progreso-general/:correo", obtenerProgresoGeneral);
router.get("/progreso-areas/:correo", obtenerProgresoAreas);

module.exports = router;
