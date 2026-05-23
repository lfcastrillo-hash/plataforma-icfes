const { Pool } = require('pg');

// 1. Configuración de tus credenciales locales de PostgreSQL
const pool = new Pool({
  user: 'postgres',            // 👈 ¡Corregido! Aquí va el nombre de usuario (usualmente 'postgres')
  host: 'localhost',           // Servidor local
  database: 'WEB',             // El nombre de la base de datos que creaste en tu pgAdmin
  password: 'admin123',        // Tu contraseña de Postgres
  port: 5432,                  // Puerto por defecto de PostgreSQL
});

// 2. Verificación automática de la conexión al iniciar el servidor
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error de conexión en PostgreSQL:', err.stack);
  } else {
    console.log('⚡ ¡Conectado con éxito a PostgreSQL local!');
  }
});

// Exportamos el pool directamente para usarlo en los controladores
module.exports = pool;