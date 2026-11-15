const fs=require('node:fs'),crypto=require('node:crypto');
const {settings,poolFor,grant}=require('./native-context.cjs');
(async()=>{
 const c=settings();if(!c.schemaPassword){c.schemaPassword=crypto.randomBytes(24).toString('hex');fs.writeFileSync('.qa-native/config.json',JSON.stringify(c,null,2));}
 const pool=poolFor();try{
  for(const [name,password] of [['prepicfes_schema',c.schemaPassword],[c.appUser,c.appPassword]]){
   const exists=await pool.query('SELECT 1 FROM pg_roles WHERE rolname=$1',[name]);
   if(!exists.rows.length)await pool.query(`CREATE ROLE ${name} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`);
  }
  await pool.query('REVOKE ALL ON DATABASE prepicfes_native_test FROM PUBLIC; GRANT CONNECT,CREATE ON DATABASE prepicfes_native_test TO prepicfes_schema; GRANT CONNECT ON DATABASE prepicfes_native_test TO prepicfes_app; REVOKE ALL ON SCHEMA public FROM PUBLIC;');
  const schemas=await pool.query("SELECT nspname FROM pg_namespace WHERE nspowner=(SELECT oid FROM pg_roles WHERE rolname='prepicfes_schema') AND nspname LIKE 'qa_%'");
  for(const {nspname} of schemas.rows)await grant(pool,nspname);
  const r=await pool.query("SELECT version(),current_database() AS database");console.log(JSON.stringify(r.rows[0]));
 }finally{await pool.end();}
})().catch(e=>{console.error('Preparación local fallida:',e.code||e.name);process.exitCode=1;});
