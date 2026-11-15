const fs=require('node:fs'),{execFileSync}=require('node:child_process'),{Pool}=require('../../backend/node_modules/pg');
const {database}=require('../../tests/fixtures/native-database.cjs'),{poolFor,settings}=require('./native-context.cjs');
(async()=>{
 const c=settings(),db=await database(),admin=poolFor();let restored;
 try{
  await db.query("INSERT INTO usuarios(nombre,email,password,rol) VALUES('Respaldo ficticio','backup@example.test','fixture-backup','estudiante')");
  await db.query("INSERT INTO progreso_areas VALUES(1,'backup@example.test','ingles',45,'{}')");
  const target='prepicfes_restore_'+Date.now()+'_test';
  await admin.query('CREATE DATABASE '+target); // Destino nuevo; nunca DROP ni --clean.
  fs.mkdirSync('.qa-native/backups',{recursive:true});const filename='backup-'+Date.now()+'.dump';
  const docker=args=>execFileSync('docker',args,{stdio:['ignore','pipe','pipe']});
  docker(['exec','prepicfes-native-20261115','pg_dump','-U',c.user,'-d',c.database,'-n',db.schema,'-Fc','--no-owner','--no-privileges','-f','/tmp/'+filename]);
  docker(['cp','prepicfes-native-20261115:/tmp/'+filename,'.qa-native/backups/'+filename]);
  docker(['exec','prepicfes-native-20261115','pg_restore','-U',c.user,'-d',target,'--no-owner','--no-privileges','/tmp/'+filename]);
  restored=new Pool({host:c.host,port:c.port,user:c.user,password:c.password,database:target,ssl:false});
  const rows=(await restored.query('SELECT count(*) FROM '+db.schema+'.usuarios')).rows;
  const progress=(await restored.query('SELECT progreso FROM '+db.schema+'.progreso_areas')).rows;
  if(Number(rows[0].count)!==1||Number(progress[0].progreso)!==45)throw Error('Restauración no coincide.');
  const report={date:new Date().toISOString(),status:'PASS',tool:'pg_dump/pg_restore nativos PostgreSQL 17',source:'Contenedor local exclusivo, esquema ficticio '+db.schema,target,rows:1,preservedProgress:45,privateBackup:'.qa-native/backups/'+filename,limitations:'Respaldo de esquema ficticio con datos; propietarios y ACL se omiten y requieren reaplicación. No incluye roles ni producción.'};
  fs.writeFileSync('evidencias/postgresql-local-20261115/respaldo-restauracion.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:'PASS',rows:1,preservedProgress:45}));
 }finally{await db.end();await admin.end();if(restored)await restored.end();}
})().catch(e=>{console.error('Respaldo local falló:',e.code||e.name);process.exitCode=1;});
