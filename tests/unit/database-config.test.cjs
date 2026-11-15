const {test}=require('node:test'),assert=require('node:assert/strict');
const {databaseConfig}=require('../../backend/lib/database-config');
const local={DATABASE_URL:'postgresql://qa:fixture@127.0.0.1:55439/prepicfes_native_test',DATABASE_MODE:'local-test',DATABASE_SSL:'false'};
test('DB configuración: local aislado y pool acotado',()=>{const c=databaseConfig(local);assert.equal(c.ssl,false);assert.equal(c.max,10);assert.equal(c.connectionTimeoutMillis,5000);});
test('DB configuración: falta URL y datos incompletos no se filtran',()=>{
 for(const env of [{},{DATABASE_URL:'not-a-url-secret'},{DATABASE_URL:'https://bad.test/secret'}])assert.throws(()=>databaseConfig(env),e=>!e.message.includes('secret')&&!e.message.includes('bad.test'));
});
test('DB configuración: local-test no admite remoto ni nombre no dedicado',()=>{
 for(const url of ['postgresql://qa:fixture@example.test/prepicfes_test','postgresql://qa:fixture@127.0.0.1/postgres'])assert.throws(()=>databaseConfig({...local,DATABASE_URL:url}));
});
test('DB configuración: TLS remoto y producción siempre verifican certificado',()=>{
 const env={DATABASE_URL:'postgresql://qa:fixture@isolated.example.test/postgres',DATABASE_MODE:'production',NODE_ENV:'production',DATABASE_SSL:'true'};
 assert.equal(databaseConfig(env).ssl.rejectUnauthorized,true);
 for(const ssl of ['false',undefined,'yes'])assert.throws(()=>databaseConfig({...env,DATABASE_SSL:ssl}));
 assert.throws(()=>databaseConfig({...local,NODE_ENV:'production'}));
});
test('DB configuración: rechaza SSL ambiguo, CA ausente y pool inválido',()=>{
 for(const param of ['sslmode=require','sslrootcert=private','uselibpqcompat=true'])assert.throws(()=>databaseConfig({...local,DATABASE_URL:local.DATABASE_URL+'?'+param}));
 assert.throws(()=>databaseConfig({...local,DATABASE_SSL:'true',DATABASE_CA_FILE:'no-existe-ca.pem'}));
 assert.throws(()=>databaseConfig({...local,DATABASE_POOL_MAX:'0'}));assert.throws(()=>databaseConfig({...local,DATABASE_CONNECT_TIMEOUT_MS:'NaN'}));
});
