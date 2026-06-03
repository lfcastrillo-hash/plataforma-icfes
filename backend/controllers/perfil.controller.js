const pool = require("../db");

// 1. Obtener el perfil (Ahora trae la biografía y la lista de clases)
const obtenerPerfil = async (req, res) => {
  try {
    const id_usuario = req.usuario.id_usuario;

    const resultado = await pool.query(
      `
      SELECT
        id_usuario,
        nombre,
        email,
        rol,
        foto_perfil,
        biografia
      FROM usuarios
      WHERE id_usuario = $1
      `,
      [id_usuario],
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    console.error("Error al obtener perfil:", error);

    res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};
// 2. Actualizar perfil (Ahora guarda biografía y opcionalmente la CONTRASEÑA)
const actualizarPerfil = async (req, res) => {
  try {
    // NUEVO: Agregamos "password" a las variables que recibimos del frontend
    const { nombre, nuevo_correo, biografia, password } = req.body;
    const id_usuario = req.usuario.id_usuario;

    if (nuevo_correo) {
      const existe = await pool.query(
        "SELECT id_usuario FROM usuarios WHERE email = $1 AND id_usuario != $2",
        [nuevo_correo, id_usuario],
      );
      if (existe.rows.length > 0) {
        return res.status(400).json({
          success: false,
          mensaje: "Ese correo ya está registrado por otro usuario.",
        });
      }
    }

    const usuarioActual = await pool.query(
      "SELECT foto_perfil, email, biografia FROM usuarios WHERE id_usuario = $1",
      [id_usuario],
    );
    if (usuarioActual.rows.length === 0)
      return res
        .status(404)
        .json({ success: false, mensaje: "Usuario no encontrado" });

    let fotoUrl = usuarioActual.rows[0].foto_perfil;
    let correoFinal = nuevo_correo || usuarioActual.rows[0].email;
    let biografiaFinal =
      biografia !== undefined ? biografia : usuarioActual.rows[0].biografia;

    if (req.file) {
      fotoUrl = "/uploads/" + req.file.filename;
    }

    // =========================================================
    // CONSTRUCCIÓN DINÁMICA DE LA CONSULTA SQL
    // =========================================================
    let sqlQuery =
      "UPDATE usuarios SET nombre = $1, email = $2, foto_perfil = $3, biografia = $4";
    let values = [nombre, correoFinal, fotoUrl, biografiaFinal];
    let contadorIndex = 5;

    // Si el usuario escribió una contraseña, la añadimos a la actualización
    if (password && password.trim() !== "") {
      sqlQuery += `, password = $${contadorIndex}`;
      values.push(password);
      contadorIndex++;
    }

    // Finalmente añadimos la condición WHERE
    sqlQuery += ` WHERE id_usuario = $${contadorIndex}`;
    values.push(id_usuario);

    // Ejecutamos la consulta dinámica
    await pool.query(sqlQuery, values);

    res.status(200).json({
      success: true,
      mensaje: "¡Perfil actualizado con éxito!",
      foto: fotoUrl,
      nombre: nombre,
      correo: correoFinal,
      biografia: biografiaFinal,
    });
  } catch (error) {
    console.error("Error al actualizar el perfil:", error);
    res
      .status(500)
      .json({ success: false, mensaje: "Error interno del servidor" });
  }
};

module.exports = { obtenerPerfil, actualizarPerfil };
