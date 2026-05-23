// Importamos el pool de PostgreSQL y la librería JWT
const pool = require("../db");
const jwt = require("jsonwebtoken");

// ESTA CLAVE DEBE SER SECRETA. (En producción se guarda en un archivo .env)
const SECRET_KEY = "icfes_secreto_123_ultra_seguro"; 

async function registrar(req, res) {
  try {
    const { nombre, correo, password, rol } = req.body;

    const existe = await pool.query(
      `SELECT * FROM usuarios WHERE email = $1`,
      [correo]
    );

    if (existe.rows.length > 0) {
      return res.json({ success: false, mensaje: "El usuario ya existe" });
    }

    await pool.query(
      `INSERT INTO usuarios(nombre, email, password, rol)
       VALUES($1, $2, $3, $4)`,
      [nombre, correo, password, rol]
    );

    res.json({ success: true, mensaje: "Usuario registrado con éxito" });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function login(req, res) {
  try {
    const { correo, password, rol } = req.body;

    const resultado = await pool.query(
      `SELECT id_usuario, nombre, email, rol, foto_perfil FROM usuarios
       WHERE email = $1 AND password = $2 AND rol = $3`,
      [correo, password, rol]
    );

    if (resultado.rows.length === 0) {
      return res.json({ success: false, mensaje: "Credenciales incorrectas" });
    }

    const usuario = resultado.rows[0];

    // 1. GENERAR EL TOKEN JWT
    // Guardamos datos básicos (payload) que usaremos luego, sin incluir la contraseña
    const tokenPayload = {
      id_usuario: usuario.id_usuario,
      correo: usuario.email,
      rol: usuario.rol
    };

    // Firmamos el token. Expira en 24 horas.
    const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: '24h' });

    // 2. ENVIAR EL TOKEN EN UNA COOKIE HTTP-ONLY
    // El navegador guardará esto automáticamente y lo enviará en futuras peticiones
    res.cookie('token_acceso', token, {
      httpOnly: true, // Evita que JavaScript (XSS) lea la cookie
      secure: false,  // Ponlo en 'true' solo si usas HTTPS (producción)
      sameSite: 'lax', // Permite envío de cookies en el mismo dominio (localhost)
      maxAge: 24 * 60 * 60 * 1000 // 24 horas de vida en milisegundos
    });

    // 3. RESPONDER AL FRONTEND (Sin enviar el token en el JSON)
    res.json({
      success: true,
      usuario: { nombre: usuario.nombre, correo: usuario.email, rol: usuario.rol }
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Nueva función para cerrar sesión (borrar la cookie)
async function logout(req, res) {
  res.clearCookie('token_acceso');
  res.json({ success: true, mensaje: "Sesión cerrada correctamente" });
}

module.exports = { registrar, login, logout };