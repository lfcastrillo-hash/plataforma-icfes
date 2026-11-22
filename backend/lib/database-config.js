const fs=require('node:fs');
const {X509Certificate}=require('node:crypto');
function fail(message){throw new Error('Configuración PostgreSQL: '+message);}
function parseConnection(value){
 if(!value)fail('falta DATABASE_URL.');
 let url;try{url=new URL(value);}catch{fail('DATABASE_URL no es válida.');}
 if(!['postgres:','postgresql:'].includes(url.protocol)||!url.hostname||!url.username||url.pathname.length<2)fail('DATABASE_URL debe identificar servidor, usuario y base.');
 for(const key of url.searchParams.keys()){if(/^ssl|^uselibpqcompat$/i.test(key))fail('retire parámetros SSL de la URL; utilice DATABASE_SSL y DATABASE_CA_FILE.');}
 return url;
}
function connectionMode(env,url){
 const mode=env.DATABASE_MODE||(env.NODE_ENV==='production'?'production':'development');
 if(!['local-test','development','production'].includes(mode))fail('DATABASE_MODE debe ser local-test, development o production.');
 const local=['127.0.0.1','localhost','[::1]'].includes(url.hostname);
 if(mode==='local-test'&&(!local||!decodeURIComponent(url.pathname).endsWith('_test')))fail('local-test requiere loopback y base terminada en _test.');
 if(env.NODE_ENV==='production'&&mode!=='production')fail('NODE_ENV=production requiere DATABASE_MODE=production.');
 return {mode,local};
}
function sslConfiguration(env,mode,local){
 if(env.DATABASE_SSL!==undefined&&!['true','false'].includes(env.DATABASE_SSL))fail('DATABASE_SSL debe ser true o false.');
 const tls=env.DATABASE_SSL==='true';
 if((!local||mode==='production')&&!tls)fail('TLS verificado es obligatorio para conexiones remotas o producción.');
 if(!env.DATABASE_CA_FILE)return tls?{rejectUnauthorized:true}:false;
 if(!tls)fail('DATABASE_CA_FILE requiere DATABASE_SSL=true.');
 let ca;try{ca=fs.readFileSync(env.DATABASE_CA_FILE,'utf8');new X509Certificate(ca);}catch{fail('no se pudo cargar un certificado CA válido.');}
 return {rejectUnauthorized:true,ca};
}
function boundedNumber(env,name,fallback,min,max){
 const raw=env[name];if(raw===undefined||raw==='')return fallback;
 const n=Number(raw);if(!Number.isInteger(n)||n<min||n>max)fail(name+' fuera de rango.');
 return n;
}
function databaseConfig(env=process.env){
 const url=parseConnection(env.DATABASE_URL),{mode,local}=connectionMode(env,url);
 return {connectionString:url.href,ssl:sslConfiguration(env,mode,local),max:boundedNumber(env,'DATABASE_POOL_MAX',10,1,50),connectionTimeoutMillis:boundedNumber(env,'DATABASE_CONNECT_TIMEOUT_MS',5000,100,60000),idleTimeoutMillis:10000};
}
module.exports={databaseConfig};