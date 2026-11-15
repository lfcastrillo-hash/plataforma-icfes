require('./config');
const { Pool } = require('pg');
const pool = new Pool(require('./lib/database-config').databaseConfig());
pool.on('error', () => console.error('Conexión de base de datos interrumpida.'));
module.exports = pool;
