const express = require("express");

const {
  guardarProgreso,
  obtenerRanking,
} = require("../controllers/progreso.controller");

const router = express.Router();

router.post("/progreso", guardarProgreso);
router.get("/ranking", obtenerRanking);

module.exports = router;
