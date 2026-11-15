const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const rateLimit=require('../../backend/middlewares/rateLimit');
test('Límites: ventana, Retry-After, cuentas separadas y mapa acotado',()=>{
 let time=0;const middleware=rateLimit({limit:2,windowMs:1000,maxKeys:2,now:()=>time});
 const call=(ip)=>{const res=new EventEmitter();res.set=(k,v)=>{res[k]=v;return res;};res.status=n=>{res.statusCode=n;return res;};res.json=()=>res;middleware({ip},res,()=>res.statusCode=200);return res;};
 assert.equal(call('a').statusCode,200);assert.equal(call('a').statusCode,200);let rejected=call('a');assert.equal(rejected.statusCode,429);assert.equal(rejected['Retry-After'],'1');assert.equal(call('b').statusCode,200);assert.equal(call('c').statusCode,429);
 time=1001;assert.equal(call('a').statusCode,200);assert.equal(call('c').statusCode,200);
});
test('Límite de autenticación descuenta respuestas exitosas',()=>{
 const middleware=rateLimit({limit:1,skipSuccessfulRequests:true});
 for(let i=0;i<3;i++){const res=new EventEmitter();res.statusCode=200;middleware({ip:'a'},res,()=>{});res.emit('finish');}
});
