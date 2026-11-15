// Único destino autorizado por este arnés: el contenedor local dedicado.
const fs=require('node:fs');
const {Pool}=require('../../backend/node_modules/pg');
const configFile=require('node:path').resolve(__dirname,'../../.qa-native/config.json');
function settings(){const c=JSON.parse(fs.readFileSync(configFile));if(c.host!=='127.0.0.1'||c.port!==55439||c.database!=='prepicfes_native_test'||c.user!=='prepicfes_migrator'||c.appUser!=='prepicfes_app')throw Error('Destino nativo no autorizado.');for(const value of [c.password,c.appPassword,...(c.schemaPassword?[c.schemaPassword]:[])])if(!/^[a-f0-9]{48}$/.test(value))throw Error('Configuración privada local inválida.');return c;}
function poolFor(role='bootstrap',schema){const c=settings();const identities={bootstrap:[c.user,c.password],migrator:['prepicfes_schema',c.schemaPassword],app:[c.appUser,c.appPassword]};const [user,password]=identities[role];return new Pool({host:c.host,port:c.port,database:c.database,user,password,ssl:false,max:10,connectionTimeoutMillis:5000,...(schema?{options:'-c search_path='+schema+',pg_catalog'}:{})});}
async function migrate(pool,files){const c=await pool.connect();try{await c.query('BEGIN');for(const file of files)await c.query(fs.readFileSync(require('node:path').join(__dirname,'../../backend/migrations',file),'utf8'));await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
async function grant(pool,schema){
 if(!/^qa_[a-z0-9_]+$/.test(schema))throw Error('Esquema de pruebas inválido.');
 await pool.query(`REVOKE ALL ON SCHEMA ${schema} FROM PUBLIC; GRANT USAGE ON SCHEMA ${schema} TO prepicfes_app;
 REVOKE ALL ON ALL TABLES IN SCHEMA ${schema} FROM prepicfes_app;
 REVOKE ALL ON ALL SEQUENCES IN SCHEMA ${schema} FROM prepicfes_app;
 GRANT USAGE ON ALL SEQUENCES IN SCHEMA ${schema} TO prepicfes_app;`);
 const privileges={usuarios:'SELECT,INSERT,UPDATE',clases:'SELECT,INSERT,UPDATE,DELETE',inscripciones:'SELECT,INSERT,DELETE',progreso_areas:'SELECT,INSERT,UPDATE',progreso_estudiante:'SELECT,UPDATE',sesiones:'SELECT,INSERT,DELETE',resultados_simulacro:'SELECT,INSERT'};
 for(const [table,rights] of Object.entries(privileges))if((await pool.query('SELECT to_regclass($1) AS relation',[schema+'.'+table])).rows[0].relation)await pool.query(`GRANT ${rights} ON ${schema}.${table} TO prepicfes_app`);
}
module.exports={settings,poolFor,migrate,grant};
