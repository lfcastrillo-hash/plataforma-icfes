const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');
const config = require('../config');
const v = require('../lib/validation');
const { hashPassword, verifyPassword } = require('../lib/passwords');
const transaction = require('../lib/transaction');
async function registrar(req, res) {
 const { nombre, correo, password, rol } = req.body;
 if (!v.text(nombre, 1, 120) || !v.email(correo) || !v.password(password) || !['estudiante', 'profesor'].includes(rol)) {return v.fail(res, 400, 'Nombre (1?120), correo válido, contraseña (8?128) y rol válido son obligatorios.');}
 try {
  await req.app.locals.pool.query('INSERT INTO usuarios (nombre,email,password,rol) VALUES ($1,$2,$3,$4)', [nombre.trim(), v.normalizeEmail(correo), await hashPassword(password), rol]);
  res.status(201).json({ success: true, mensaje: 'Usuario registrado con éxito' });
 } catch (error) { if (error.code === '23505') {return v.fail(res, 409, 'El correo ya está registrado.');} throw error; }
}
async function login(req, res) {
 const { correo, password, rol } = req.body;
 if (!v.email(correo) || typeof password !== 'string' || !password.length || password.length > 128 || !['estudiante','profesor'].includes(rol)) {return v.fail(res, 400, 'Completa los datos de acceso correctamente.');}
 const pool = req.app.locals.pool;
 const result = await pool.query('SELECT id_usuario,nombre,email,password,rol FROM usuarios WHERE lower(email) = $1 AND rol = $2', [v.normalizeEmail(correo), rol]);
 const usuario = result.rows[0];
 const valid = usuario ? await verifyPassword(password, usuario.password, config.legacyPasswords) : (await hashPassword(password), false);
 if (!valid) {return v.fail(res, 401, 'Credenciales incorrectas.');}
 const sessionId = randomUUID();
 await transaction(pool, async client => {
  if (!usuario.password.startsWith('scrypt$')) {await client.query('UPDATE usuarios SET password = $1 WHERE id_usuario = $2 AND password = $3', [await hashPassword(password), usuario.id_usuario, usuario.password]);}
  await client.query('DELETE FROM sesiones WHERE expira <= NOW()');
  await client.query("INSERT INTO sesiones (id_sesion,id_usuario,expira) VALUES ($1,$2,NOW() + INTERVAL '24 hours')", [sessionId, usuario.id_usuario]);
 });
 const token = jwt.sign({ id_usuario: usuario.id_usuario }, config.jwtSecret, { algorithm:'HS256', expiresIn:'24h', jwtid:sessionId, issuer:'prepicfes', audience:'prepicfes-web' });
 res.cookie('token_acceso', token, { ...config.cookie, maxAge:86400000 });
 res.json({ success:true, usuario:{ id_usuario:usuario.id_usuario, nombre:usuario.nombre, correo:usuario.email, rol:usuario.rol } });
}
async function logout(req, res) {
 await req.app.locals.pool.query('DELETE FROM sesiones WHERE id_sesion = $1', [req.sessionId]);
 res.clearCookie('token_acceso', config.cookie); res.json({ success:true, mensaje:'Sesión cerrada correctamente' });
}
module.exports = { registrar, login, logout };
