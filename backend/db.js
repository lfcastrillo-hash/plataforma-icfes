require('./config');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL,
 ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
 connectionTimeoutMillis: 5000, max: 10 });
pool.on('error', () => console.error('Conexión de base de datos interrumpida.'));
module.exports = pool;
