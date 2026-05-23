const express = require("express");
const verificarToken = require("../middlewares/verificarToken");

const { 
  crearClase, 
  eliminarClase, 
  agregarEstudianteAClase, 
  removerEstudianteDeClase,
  obtenerClases,
  obtenerEstudiantesDeClase,
  buscarEstudiante,
  actualizarAnuncio // Importado
} = require("../controllers/clases.controller");

const router = express.Router();

// Rutas protegidas con verificarToken
router.get("/clases", verificarToken, obtenerClases);
router.post("/clases", verificarToken, crearClase);
router.delete("/clases/:id", verificarToken, eliminarClase);
router.post("/clases/:id_clase/anuncio", verificarToken, actualizarAnuncio); // Nueva Ruta de Anuncios

router.get("/clases/:id/estudiantes", verificarToken, obtenerEstudiantesDeClase);
router.post("/inscripciones/agregar", verificarToken, agregarEstudianteAClase);
router.post("/inscripciones/remover", verificarToken, removerEstudianteDeClase);

router.get("/estudiantes/buscar", verificarToken, buscarEstudiante);

module.exports = router;