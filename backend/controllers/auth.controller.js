const conectar = require("../db");

async function registrar(req, res) {
  try {
    const { nombre, correo, password, rol } = req.body;

    const conexion = await conectar();

    const existe = await conexion.execute(
      `SELECT * FROM usuarios WHERE correo = :correo`,
      [correo],
    );

    if (existe.rows.length > 0) {
      return res.json({
        success: false,
        mensaje: "El usuario ya existe",
      });
    }

    await conexion.execute(
      `INSERT INTO usuarios(nombre, correo, password, rol)
       VALUES(:nombre, :correo, :password, :rol)`,
      [nombre, correo, password, rol],
      { autoCommit: true },
    );

    res.json({
      success: true,
      mensaje: "Usuario registrado",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
}

async function login(req, res) {
  try {
    const { correo, password, rol } = req.body;

    const conexion = await conectar();

    const resultado = await conexion.execute(
      `SELECT * FROM usuarios
       WHERE correo = :correo
       AND password = :password
       AND rol = :rol`,
      [correo, password, rol],
    );

    if (resultado.rows.length === 0) {
      return res.json({
        success: false,
        mensaje: "Credenciales incorrectas",
      });
    }

    res.json({
      success: true,
      usuario: resultado.rows[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
}

module.exports = {
  registrar,
  login,
};
