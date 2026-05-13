const conectar = require("../db");

async function guardarProgreso(req, res) {
  try {
    const { correo, progreso } = req.body;

    const conexion = await conectar();

    await conexion.execute(
      `
      MERGE INTO progreso p
      USING dual
      ON (p.correo = :correo)
      WHEN MATCHED THEN
        UPDATE SET p.progreso = :progreso
      WHEN NOT MATCHED THEN
        INSERT (correo, progreso)
        VALUES (:correo, :progreso)
      `,
      [correo, progreso],
      { autoCommit: true },
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
}

async function obtenerRanking(req, res) {
  try {
    const conexion = await conectar();

    const resultado = await conexion.execute(`
      SELECT u.nombre, u.correo, NVL(p.progreso,0)
      FROM usuarios u
      LEFT JOIN progreso p
      ON u.correo = p.correo
      WHERE u.rol = 'estudiante'
      ORDER BY p.progreso DESC
    `);

    res.json(resultado.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
}

module.exports = {
  guardarProgreso,
  obtenerRanking,
};
