const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function setup(fetcher=async()=>({ok:true,json:async()=>({success:true})})){
 const values=new Map([['datosVisionales',JSON.stringify({id_usuario:1,correo:'qa@example.test'})]]),events={},alerts=[];
 const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const window={fetch:fetcher,location:{href:'http://localhost/perfil.html',origin:'http://localhost',reload(){window.reloaded=true;}},addEventListener:(e,f)=>events[e]=f};
 const c=vm.createContext({window,location:window.location,localStorage,sessionStorage:{removeItem(){}},document:{addEventListener:(e,f)=>events['document:'+e]=f,querySelectorAll:()=>[]},URL,Headers,alert:m=>alerts.push(m),console:{error(){}},fetch:(...a)=>window.fetch(...a)});
 vm.runInContext(fs.readFileSync('frontend/js/prep.js','utf8'),c,{filename:path.resolve('frontend/js/prep.js')});
 return {p:window.Prep,window,localStorage,events,alerts};
}
test('Prep: cola concurrente comparte envío y conserva resultados añadidos durante la petición',async()=>{
 let resolve,calls=0;const s=setup(()=>{calls++;return new Promise(r=>resolve=r);});
 s.p.queueResult({id_resultado:'a'});const first=s.p.syncResults();assert.equal(first,s.p.syncResults());s.p.queueResult({id_resultado:'b'});
 resolve({ok:true,json:async()=>({success:true})});await first;assert.equal(calls,1);assert.equal(s.p.hasPendingResult('a'),false);assert.equal(s.p.hasPendingResult('b'),true);
 const second=s.p.syncResults();resolve({ok:true,json:async()=>({success:true})});await second;assert.equal(s.p.hasPendingResult('b'),false);
});
test('Prep: fallo HTTP conserva la cola y online reintenta automáticamente',async()=>{
 let fail=true,calls=0;const s=setup(async()=>{calls++;return {ok:!fail,status:503,json:async()=>({mensaje:'Temporal'})};});
 s.p.queueResult({id_resultado:'a'});await assert.rejects(s.p.syncResults(),/Temporal/);assert.equal(s.p.hasPendingResult('a'),true);
 fail=false;s.events.online();await s.p.syncResults();assert.equal(s.p.hasPendingResult('a'),false);assert.equal(calls,2);
});
test('Prep: actualizar perfil persiste datos y recarga solo en éxito',async()=>{
 const s=setup(async()=>({ok:true,json:async()=>({correo:'nuevo@example.test',nombre:'Nuevo'})}));
 await s.p.updateProfile({}, {},'Guardado','Falló');assert.equal(JSON.parse(s.localStorage.getItem('datosVisionales')).nombre,'Nuevo');assert.equal(s.window.reloaded,true);assert.deepEqual(s.alerts,['Guardado']);
});
test('Prep: errores HTTP y de red al editar no reemplazan sesión ni recargan',async()=>{
 for(const network of [false,true]){const s=setup(async()=>{if(network)throw Error('offline');return {ok:false,status:400,json:async()=>({mensaje:'Correo inválido'})};});
 await s.p.updateProfile({}, {},'Guardado','Falló');assert.equal(s.window.reloaded,undefined);assert.equal(JSON.parse(s.localStorage.getItem('datosVisionales')).id_usuario,1);assert.match(s.alerts[0],network?/conexión/:/Correo inválido/);}
});
test('Prep: fetch bloquea cambio de cuenta antes y durante petición protegida',async()=>{
 let resolve;const s=setup(()=>new Promise(r=>resolve=r));const request=s.window.fetch('/api/perfil');s.localStorage.setItem('datosVisionales',JSON.stringify({id_usuario:2}));resolve({ok:true});await assert.rejects(request,/durante/);await assert.rejects(s.window.fetch('/api/perfil'),/otra pestaña/);
});
