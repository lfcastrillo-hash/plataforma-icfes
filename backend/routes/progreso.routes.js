const express = require("express");

const router = express.Router();

const {
  guardarProgreso,
  obtenerProgreso,
  obtenerRanking,
} = require("../controllers/progreso.controller.js");

router.post("/progreso", guardarProgreso);

router.get("/progreso/:correo", obtenerProgreso);

router.get("/ranking", obtenerRanking);

module.exports = router;
