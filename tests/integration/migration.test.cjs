const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');
const migration=fs.readFileSync('backend/migrations/002_compatibilidad_existente.sql','utf8');
async function legacy(){const db=process.env.QA_DATABASE_ENGINE==='postgres'?await require('../fixtures/native-database.cjs').database({empty:true}):new (require('@electric-sql/pglite').PGlite)();await db.exec(`
 CREATE TABLE usuarios(id_usuario SERIAL PRIMARY KEY,nombre TEXT,email TEXT UNIQUE,password VARCHAR(100),rol TEXT);
 CREATE TABLE clases(id_clase SERIAL PRIMARY KEY,nombre_clase TEXT,id_profesor INTEGER REFERENCES usuarios(id_usuario),codigo_acceso TEXT);
 CREATE TABLE inscripciones(id_usuario INTEGER REFERENCES usuarios(id_usuario),id_clase INTEGER REFERENCES clases(id_clase));
 CREATE TABLE progreso_areas(correo TEXT REFERENCES usuarios(email),area TEXT,progreso NUMERIC,UNIQUE(correo,area));
 CREATE TABLE progreso_estudiante(correo TEXT UNIQUE REFERENCES usuarios(email),progreso_global NUMERIC,progreso_ingles NUMERIC);
 INSERT INTO usuarios(nombre,email,password,rol) VALUES('Anterior QA','legacy@example.test','legacy-fixture','estudiante');
 INSERT INTO progreso_areas VALUES('legacy@example.test','matematicas',45);
 INSERT INTO progreso_estudiante VALUES('legacy@example.test',9,60);
 `);return db;}
test('DB-MIG copia del esquema inferido: migración idempotente conserva avances y correo deja de ser identidad',async()=>{
 const db=await legacy();try{
  await db.exec('BEGIN;'+migration+'COMMIT;');await db.exec('BEGIN;'+migration+'COMMIT;');
  const p=await db.query('SELECT * FROM progreso_areas');assert.equal(p.rows[0].id_usuario,1);assert.equal(Number(p.rows[0].progreso),45);
  assert.equal(Number(p.rows.find(r=>r.area==='ingles').progreso),60);
  await db.query("UPDATE usuarios SET email='changed@example.test' WHERE id_usuario=1");
  assert.equal((await db.query('SELECT password FROM usuarios')).rows[0].password,'legacy-fixture');
 }finally{await db.close();}
});
test('DB-MIG duplicados normalizados abortan sin borrar cuentas',async()=>{
 const db=await legacy();try{
  await db.query("INSERT INTO usuarios(nombre,email,password,rol) VALUES('Duplicado','LEGACY@example.test','fixture','estudiante')");
  await assert.rejects(db.exec('BEGIN;'+migration+'COMMIT;'));await db.exec('ROLLBACK;');
  assert.equal((await db.query('SELECT * FROM usuarios')).rows.length,2);
 }finally{await db.close();}
});
