const { Pool } = require('pg');

// 1. Pegamos el enlace de Supabase aquí dentro de una variable
// ⚠️ RECUERDA: Cambia [YOUR-PASSWORD] por tu contraseña real de Supabase (y borra los corchetes)
const urlConexion = 'postgresql://postgres.pbldeiwhsraryvluhbjt:Pavel11222134@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString: urlConexion,
});

// 2. Verificación automática de la conexión al iniciar el servidor
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error de conexión en Supabase:', err.stack);
  } else {
    console.log('¡Conectado con éxito a la base de datos en Supabase!');
  }
});

// Exportamos el pool directamente para usarlo en los controladores
module.exports = pool;