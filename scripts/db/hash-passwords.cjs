const {Pool}=require('../../backend/node_modules/pg');
const {hashPassword}=require('../../backend/lib/passwords');
const url=new URL(process.env.TEST_DATABASE_URL||'invalid:');
if(!/^postgres(?:ql)?:$/.test(url.protocol)||!url.pathname.endsWith('_test'))throw new Error('Solo admite TEST_DATABASE_URL con nombre terminado en _test. No usar sobre producción.');
const pool=new Pool({connectionString:url.href});
(async()=>{
 const client=await pool.connect();let count=0;
 try{
  await client.query('BEGIN');
  const result=await client.query("SELECT id_usuario,password FROM usuarios WHERE password NOT LIKE 'scrypt$%' FOR UPDATE");
  for(const u of result.rows){await client.query('UPDATE usuarios SET password=$1 WHERE id_usuario=$2',[await hashPassword(u.password),u.id_usuario]);count++;}
  await client.query('COMMIT');console.log('Cuentas de prueba migradas a scrypt: '+count);
 }catch(error){await client.query('ROLLBACK');console.error('Conversión cancelada:',error.code||error.name);process.exitCode=1;}
 finally{client.release();await pool.end();}
})();
