const pool = require("../db"); // Tu conexión a Postgres

// ==========================================
// SECCIÓN: CLASES (SALONES)
// ==========================================

// OBTENER CLASES: Ahora también selecciona el campo "anuncio"
const obtenerClases = async (req, res) => {
  const { correo } = req.query;
  if (!correo)
    return res
      .status(400)
      .json({ success: false, mensaje: "Falta el correo." });

  try {
    const prof = await pool.query(
      "SELECT id_usuario FROM usuarios WHERE email = $1 AND rol = 'profesor'",
      [correo],
    );
    if (prof.rows.length === 0)
      return res
        .status(404)
        .json({ success: false, mensaje: "Profesor no encontrado." });

    const id_profesor = prof.rows[0].id_usuario;
    const resultado = await pool.query(
      "SELECT id_clase, nombre_clase, codigo_acceso, anuncio FROM clases WHERE id_profesor = $1 ORDER BY id_clase ASC",
      [id_profesor],
    );
    res.json({ success: true, clases: resultado.rows });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, mensaje: "Error al obtener clases." });
  }
};

// CREAR CLASE: Inicializa el salón con anuncio vacío por defecto
const crearClase = async (req, res) => {
  const { nombre_clase, correo_profesor } = req.body;
  if (!nombre_clase || !correo_profesor)
    return res.status(400).json({ success: false, mensaje: "Faltan datos." });

  try {
    const prof = await pool.query(
      "SELECT id_usuario FROM usuarios WHERE email = $1 AND rol = 'profesor'",
      [correo_profesor],
    );
    if (prof.rows.length === 0)
      return res
        .status(404)
        .json({ success: false, mensaje: "Profesor no encontrado." });

    const id_profesor = prof.rows[0].id_usuario;
    const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

    const resultado = await pool.query(
      "INSERT INTO clases (nombre_clase, id_profesor, codigo_acceso, anuncio) VALUES ($1, $2, $3, '') RETURNING *",
      [nombre_clase.trim(), id_profesor, codigo],
    );
    res.json({ success: true, clase: resultado.rows[0] });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, mensaje: "Error al crear la clase." });
  }
};

// ELIMINAR CLASE
const eliminarClase = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM inscripciones WHERE id_clase = $1", [id]);
    await pool.query("DELETE FROM clases WHERE id_clase = $1", [id]);
    res.json({
      success: true,
      mensaje: "Clase y sus inscripciones eliminadas correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar clase:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al intentar eliminar el grupo.",
    });
  }
};

// NUEVA: Actualizar el anuncio de una clase específica
const actualizarAnuncio = async (req, res) => {
  try {
    const { id_clase } = req.params;
    const { anuncio } = req.body;

    await pool.query("UPDATE clases SET anuncio = $1 WHERE id_clase = $2", [
      anuncio,
      id_clase,
    ]);

    res
      .status(200)
      .json({ success: true, mensaje: "¡Anuncio publicado con éxito!" });
  } catch (error) {
    console.error("Error al publicar anuncio:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error en el servidor al guardar el anuncio.",
    });
  }
};

// ==========================================
// SECCIÓN: GESTIÓN DE ESTUDIANTES (INSCRIPCIONES)
// ==========================================

// OBTENER ESTUDIANTES DE CLASE
const obtenerEstudiantesDeClase = async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query(
      `
      SELECT 
        u.nombre,
        u.email AS correo,
        COALESCE(ROUND(AVG(pa.progreso)), 0) AS puntaje
      FROM inscripciones i
      JOIN usuarios u ON u.id_usuario = i.id_usuario
      LEFT JOIN progreso_areas pa ON pa.correo = u.email
      WHERE i.id_clase = $1
      GROUP BY u.nombre, u.email
      ORDER BY puntaje DESC
    `,
      [id],
    );

    res.json({ success: true, estudiantes: resultado.rows });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, mensaje: "Error al obtener estudiantes." });
  }
};

// BUSCAR ESTUDIANTE (Corregido el bug de "student")
const buscarEstudiante = async (req, res) => {
  const { q, correo_profesor } = req.query;
  if (!q || !correo_profesor) return res.status(400).json({ success: false });

  try {
    const prof = await pool.query(
      "SELECT id_usuario FROM usuarios WHERE email = $1",
      [correo_profesor],
    );
    if (prof.rows.length === 0) return res.status(404).json({ success: false });
    const id_profesor = prof.rows[0].id_usuario;

    const est = await pool.query(
      "SELECT id_usuario, nombre, email FROM usuarios WHERE email ILIKE $1 AND rol = 'estudiante'",
      [`%${q}%`],
    );

    if (est.rows.length === 0)
      return res.json({ success: true, estudiante: null });

    const estudiante = est.rows[0];

    const clases = await pool.query(
      `
      SELECT c.nombre_clase FROM inscripciones i
      JOIN clases c ON c.id_clase = i.id_clase
      WHERE i.id_usuario = $1 AND c.id_profesor = $2
    `,
      [estudiante.id_usuario, id_profesor],
    ); // <-- CORREGIDO: estudiante en vez de student

    res.json({
      success: true,
      student: {
        // Se mantiene la interfaz esperada por tu JS
        nombre: estudiante.nombre,
        correo: estudiante.email,
        clases: clases.rows.map((r) => r.nombre_clase),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, mensaje: "Error en búsqueda." });
  }
};

// AGREGAR ESTUDIANTE A CLASE
const agregarEstudianteAClase = async (req, res) => {
  const { email, id_clase } = req.body;
  if (!email || !id_clase)
    return res
      .status(400)
      .json({ success: false, mensaje: "Faltan datos obligatorios." });

  try {
    const buscarUsuario = await pool.query(
      "SELECT id_usuario FROM usuarios WHERE email = $1 AND rol = 'estudiante'",
      [email.trim()],
    );
    if (buscarUsuario.rows.length === 0)
      return res
        .status(404)
        .json({ success: false, mensaje: "Estudiante no encontrado." });

    const id_estudiante = buscarUsuario.rows[0].id_usuario;
    const comprobarInscripcion = await pool.query(
      "SELECT * FROM inscripciones WHERE id_usuario = $1 AND id_clase = $2",
      [id_estudiante, id_clase],
    );
    if (comprobarInscripcion.rows.length > 0)
      return res.status(400).json({
        success: false,
        mensaje: "El estudiante ya pertenece a este grupo.",
      });

    await pool.query(
      "INSERT INTO inscripciones (id_usuario, id_clase) VALUES ($1, $2)",
      [id_estudiante, id_clase],
    );
    res.json({ success: true, mensaje: "Estudiante agregado con éxito." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, mensaje: "Error al procesar la inscripción." });
  }
};

// REMOVER ESTUDIANTE DE CLASE
const removerEstudianteDeClase = async (req, res) => {
  const { email, id_clase } = req.body;
  if (!email || !id_clase)
    return res
      .status(400)
      .json({ success: false, mensaje: "Faltan parámetros indispensables." });

  try {
    const buscarUsuario = await pool.query(
      "SELECT id_usuario FROM usuarios WHERE email = $1",
      [email.trim()],
    );
    if (buscarUsuario.rows.length === 0)
      return res
        .status(404)
        .json({ success: false, mensaje: "Usuario no encontrado." });

    const id_estudiante = buscarUsuario.rows[0].id_usuario;
    await pool.query(
      "DELETE FROM inscripciones WHERE id_usuario = $1 AND id_clase = $2",
      [id_estudiante, id_clase],
    );
    res.json({
      success: true,
      mensaje: "Estudiante removido de la clase correctamente.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      mensaje: "Error en el servidor al intentar remover al alumno.",
    });
  }
};

// OBTENER CLASES EN LAS QUE ESTÁ INSCRITO UN ESTUDIANTE
const obtenerClasesDeEstudiante = async (req, res) => {
  const id_usuario = req.usuario.id_usuario;

  try {
    const resultado = await pool.query(
      `SELECT 
        c.id_clase,
        c.nombre_clase,
        u.nombre AS nombre_profesor
       FROM inscripciones i
       JOIN clases c ON c.id_clase = i.id_clase
       JOIN usuarios u ON u.id_usuario = c.id_profesor
       WHERE i.id_usuario = $1
       ORDER BY c.id_clase ASC`,
      [id_usuario],
    );

    res.json({ success: true, clases: resultado.rows });
  } catch (err) {
    console.error("Error al obtener clases del estudiante:", err);
    res.status(500).json({ success: false, mensaje: "Error en el servidor." });
  }
};

module.exports = {
  crearClase,
  eliminarClase,
  agregarEstudianteAClase,
  removerEstudianteDeClase,
  obtenerClases,
  obtenerEstudiantesDeClase,
  buscarEstudiante,
  actualizarAnuncio,
  obtenerClasesDeEstudiante,
};
