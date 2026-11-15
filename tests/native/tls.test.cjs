const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {Pool}=require('../../backend/node_modules/pg'),{settings}=require('../../scripts/db/native-context.cjs');
const {databaseConfig}=require('../../backend/lib/database-config');
function config(ca='ca.crt'){
 const c=settings(),url=new URL('postgresql://127.0.0.1:'+c.port+'/'+c.database);url.username=c.appUser;url.password=c.appPassword;
 return databaseConfig({DATABASE_URL:url.href,DATABASE_MODE:'local-test',DATABASE_SSL:'true',DATABASE_CA_FILE:path.resolve('.qa-native',ca)});
}
test('PG-TLS01 conexión pg real con CA local verificada y cifrado comprobado',async()=>{
 const pool=new Pool(config());try{const r=await pool.query('SELECT ssl,version FROM pg_stat_ssl WHERE pid=pg_backend_pid()');assert.equal(r.rows[0].ssl,true);assert.match(r.rows[0].version,/^TLSv/);}finally{await pool.end();}
});
test('PG-TLS02 CA no confiable rechazada sin desactivar verificación',async()=>{
 const pool=new Pool(config('wrong-ca.crt'));try{await assert.rejects(pool.connect(),e=>['SELF_SIGNED_CERT_IN_CHAIN','UNABLE_TO_VERIFY_LEAF_SIGNATURE','UNABLE_TO_GET_ISSUER_CERT_LOCALLY'].includes(e.code));}finally{await pool.end();}
});
test('PG-TLS03 identidad del servidor incorrecta rechazada en loopback',async()=>{
 const cfg=config();cfg.ssl.servername='unmatched.example.test';const pool=new Pool(cfg);try{await assert.rejects(pool.connect(),e=>e.code==='ERR_TLS_CERT_ALTNAME_INVALID');}finally{await pool.end();}
});
