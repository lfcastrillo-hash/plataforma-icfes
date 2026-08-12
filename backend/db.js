require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Verificación automática de la conexión al iniciar el servidor
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Error de conexión con Supabase:", err.message);
  } else {
    console.log("✅ ¡Conectado con éxito a la base de datos en Supabase!");
    console.log("🕐 Hora del servidor:", res.rows[0].now);
  }
});

// Exportamos el pool para utilizarlo en los controladores
module.exports = pool;
