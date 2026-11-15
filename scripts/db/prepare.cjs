const fs=require('node:fs');
const path=require('node:path');
const {Pool}=require('../../backend/node_modules/pg');
const mode=process.argv[2];
if(!['new','legacy'].includes(mode))throw new Error('Uso: node scripts/db/prepare.cjs new|legacy; SOLO TEST_DATABASE_URL con nombre terminado en _test');
const url=new URL(process.env.TEST_DATABASE_URL || 'invalid:');
if(!/^postgres(?:ql)?:$/.test(url.protocol)||!url.pathname.endsWith('_test'))throw new Error('Se requiere TEST_DATABASE_URL de una base cuyo nombre termine en _test. No se usará DATABASE_URL.');
if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw new Error('Esta preparación solo permite PostgreSQL local. Supabase requiere un procedimiento autorizado separado.');
const pool=new Pool({connectionString:url.href});
(async()=>{
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  const exists=(await client.query("SELECT to_regclass('usuarios') AS tabla")).rows[0].tabla;
  if(mode==='new'&&exists)throw new Error('La base ya contiene usuarios; inspeccione el esquema y utilice legacy solo tras revisarlo.');
  if(mode==='legacy'&&!exists)throw new Error('No existe el esquema antiguo.');
  const file=mode==='new'?'001_esquema.sql':'002_compatibilidad_existente.sql';
  await client.query(fs.readFileSync(path.join(__dirname,'../../backend/migrations',file),'utf8'));
  await client.query(fs.readFileSync(path.join(__dirname,'../../backend/migrations','003_contrato_final.sql'),'utf8'));
  await client.query('COMMIT');console.log('Esquema de pruebas preparado.');
 }catch(error){await client.query('ROLLBACK');console.error('Migración cancelada:',error.code||error.message);process.exitCode=1;}
 finally{client.release();await pool.end();}
})();
