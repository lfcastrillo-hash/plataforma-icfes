const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
// PostgreSQL WASM real en memoria. No emula consultas, y no conecta a Supabase.
async function database({ directory } = {}) {
  const db = new PGlite(directory);
  await db.waitReady;
  const sql = fs.readFileSync(path.join(__dirname,'../../backend/migrations/001_esquema.sql'),'utf8');
  await db.exec(sql);
  let tail = Promise.resolve();
  async function acquire() {
    const previous = tail;
    let release;
    tail = new Promise(resolve => { release = resolve; });
    await previous;
    return release;
  }
  async function query(sql, values) { const release = await acquire(); try { return await db.query(sql, values); } finally { release(); } }
  return {
    query,
    connect: async () => { const release = await acquire(); return { query: (sql, values) => db.query(sql, values), release }; },
    end: () => db.close(),
    engine: 'PGlite/PostgreSQL WASM, sin servidor de red',
  };
}
module.exports = { database };
