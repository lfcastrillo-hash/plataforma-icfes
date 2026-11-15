const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {database}=require('../fixtures/native-database.cjs');
const model=require('../../scripts/db/schema-contract.cjs');
const sql=file=>fs.readFileSync('backend/migrations/'+file,'utf8');
async function legacy(){const db=await database({empty:true});const source=fs.readFileSync('tests/integration/migration.test.cjs','utf8');await db.exec(source.match(/await db\.exec\(`([\s\S]*?)`\)/)[1]);return db;}
async function snapshot(db){
 const columns=(await db.query(`SELECT table_name,column_name,data_type,character_maximum_length,is_nullable,column_default FROM information_schema.columns WHERE table_schema=current_schema() ORDER BY table_name,column_name`)).rows;
 const constraints=(await db.query(`SELECT t.relname,c.contype,pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=current_schema() AND (c.conname LIKE 'v3_%' OR c.contype='p') ORDER BY t.relname,c.contype,definition`)).rows;
 const indexes=(await db.query("SELECT indexname,indexdef FROM pg_indexes WHERE schemaname=current_schema() AND indexname LIKE 'v3_%' ORDER BY indexname")).rows;
 return JSON.parse(JSON.stringify({columns,constraints,indexes}).replaceAll(db.schema,'SCHEMA'));
}
test('PG-N01 esquemas nuevo/histórico equivalentes, repetibles y sin perder filas',async()=>{
 const fresh=await database({empty:true}),old=await legacy();try{
  await fresh.exec('BEGIN;'+sql('001_esquema.sql')+sql('003_contrato_final.sql')+'COMMIT;');
  await old.exec('BEGIN;'+sql('002_compatibilidad_existente.sql')+sql('003_contrato_final.sql')+'COMMIT;');
  const a=await snapshot(fresh),b=await snapshot(old);assert.deepEqual(b,a);
  for(const db of [fresh,old]){const before=await snapshot(db);await db.exec('BEGIN;'+sql('003_contrato_final.sql')+'COMMIT;');assert.deepEqual(await snapshot(db),before);}
  const rows=(await old.query('SELECT password FROM usuarios')).rows;assert.equal(rows.length,1);assert.equal(rows[0].password,'legacy-fixture');
  assert.equal(Number((await old.query("SELECT progreso FROM progreso_areas WHERE area='ingles'")).rows[0].progreso),60);
 }finally{await fresh.close();await old.close();}
});
for(const [name,mutation] of [
 ['nulo',"UPDATE usuarios SET nombre=NULL"],
 ['duplicado',"INSERT INTO inscripciones VALUES(1,1),(1,1)"],
 ['huerfano',"ALTER TABLE clases DROP CONSTRAINT clases_id_profesor_fkey; INSERT INTO clases VALUES(1,'QA',999,'FICTICIO','')"],
 ['longitud',"UPDATE usuarios SET nombre=repeat('x',121)"],
 ['porcentaje',"UPDATE progreso_estudiante SET progreso_global=101"]
])test('PG-N02 preflight aborta '+name+' sin borrar datos',async()=>{
 const db=await legacy();try{
  await db.exec('BEGIN;'+sql('002_compatibilidad_existente.sql')+'COMMIT;');
  if(name==='duplicado')await db.exec("DROP INDEX inscripciones_usuario_clase;INSERT INTO clases VALUES(1,'QA',1,'FICTICIO','')");
  await db.exec(mutation);const count=Number((await db.query('SELECT count(*) FROM usuarios')).rows[0].count);
  await assert.rejects(db.exec('BEGIN;'+sql('003_contrato_final.sql')+'COMMIT;'));await db.exec('ROLLBACK');
  assert.equal(Number((await db.query('SELECT count(*) FROM usuarios')).rows[0].count),count);
 }finally{await db.close();}
});
test('PG-N03 todas las PK/FK y NOT NULL requeridas existen en PostgreSQL',async()=>{
 const db=await database();try{
  for(const [table,m] of Object.entries(model)){
   const pk=await db.query(`SELECT count(*) FROM pg_constraint WHERE conrelid=$1::regclass AND contype='p'`,[table]);assert.equal(Number(pk.rows[0].count),1);
   for(const column of m.required){const r=await db.query('SELECT is_nullable FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 AND column_name=$3',[db.schema,table,column]);assert.equal(r.rows[0].is_nullable,'NO');}
  }
 }finally{await db.end();}
});
