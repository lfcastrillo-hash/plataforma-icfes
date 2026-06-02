const pool = require("../db");

async function guardarProgresoArea(req, res) {
  try {
    const { correo, area, progreso } = req.body;

    await pool.query(
      `
      INSERT INTO progreso_areas(correo, area, progreso)
      VALUES($1,$2,$3)
      ON CONFLICT(correo, area)
      DO UPDATE SET progreso = EXCLUDED.progreso
      `,
      [correo, area, progreso],
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
}

async function obtenerProgresoGeneral(req, res) {
  try {
    const { correo } = req.params;

    const resultado = await pool.query(
      `
      SELECT AVG(progreso) AS progreso
      FROM progreso_areas
      WHERE correo = $1
      `,
      [correo],
    );

    const progreso = Number(resultado.rows[0].progreso || 0);

    res.json({
      success: true,
      progreso,
      simulacro1: progreso >= 50,
      simulacro2: progreso >= 75,
      simulacro3: progreso >= 100,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
}

module.exports = {
  guardarProgresoArea,
  obtenerProgresoGeneral,
};
