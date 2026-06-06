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

    // Siempre dividir entre 5 áreas fijas aunque algunas aún no tengan progreso
    const resultado = await pool.query(
      `
      SELECT COALESCE(SUM(progreso), 0) AS suma
      FROM progreso_areas
      WHERE correo = $1
        AND area IN ('matematicas', 'lectura', 'ciencias', 'sociales', 'ingles')
      `,
      [correo],
    );

    const progreso = Math.round(Number(resultado.rows[0].suma || 0) / 5);

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

async function obtenerProgresoAreas(req, res) {
  try {
    const { correo } = req.params;
    const resultado = await pool.query(
      `SELECT area, progreso FROM progreso_areas WHERE correo = $1`,
      [correo],
    );
    // Devuelve un objeto { matematicas: 40, lectura: 60, ... }
    const areas = {
      matematicas: 0,
      lectura: 0,
      ciencias: 0,
      sociales: 0,
      ingles: 0,
    };
    resultado.rows.forEach((r) => {
      if (areas.hasOwnProperty(r.area)) areas[r.area] = Number(r.progreso);
    });
    res.json({ success: true, areas });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
}

module.exports = {
  guardarProgresoArea,
  obtenerProgresoGeneral,
  obtenerProgresoAreas,
};
