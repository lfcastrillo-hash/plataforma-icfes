const pool = require("../db");

async function obtenerProgreso(req, res) {
  try {
    const { correo } = req.params;

    const resultado = await pool.query(
      `
      SELECT *
      FROM progreso_estudiante
      WHERE correo = $1
      `,
      [correo],
    );

    if (resultado.rows.length === 0) {
      return res.json({
        progreso_global: 0,
        progreso_matematicas: 0,
        progreso_lectura: 0,
        progreso_ciencias: 0,
        progreso_sociales: 0,
        progreso_ingles: 0,
      });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
}

async function guardarProgreso(req, res) {
  try {
    const { correo, matematicas, lectura, ciencias, sociales, ingles } =
      req.body;

    const progresoGlobal = Math.round(
      (matematicas + lectura + ciencias + sociales + ingles) / 5,
    );

    await pool.query(
      `
      INSERT INTO progreso_estudiante(
        correo,
        progreso_matematicas,
        progreso_lectura,
        progreso_ciencias,
        progreso_sociales,
        progreso_ingles,
        progreso_global
      )
      VALUES($1,$2,$3,$4,$5,$6,$7)

      ON CONFLICT(correo)
      DO UPDATE SET
        progreso_matematicas = EXCLUDED.progreso_matematicas,
        progreso_lectura = EXCLUDED.progreso_lectura,
        progreso_ciencias = EXCLUDED.progreso_ciencias,
        progreso_sociales = EXCLUDED.progreso_sociales,
        progreso_ingles = EXCLUDED.progreso_ingles,
        progreso_global = EXCLUDED.progreso_global
      `,
      [
        correo,
        matematicas,
        lectura,
        ciencias,
        sociales,
        ingles,
        progresoGlobal,
      ],
    );

    res.json({
      success: true,
      progresoGlobal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
}

async function obtenerRanking(req, res) {
  try {
    const resultado = await pool.query(`
      SELECT
      correo,
      progreso_global
      FROM progreso_estudiante
      ORDER BY progreso_global DESC
    `);

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
}

module.exports = {
  guardarProgreso,
  obtenerProgreso,
  obtenerRanking,
};
