const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Regresión: respuesta atrasada de clase no reemplaza estudiantes activos',async()=>{
 const elements=new Map();const element=()=>({style:{},value:'',textContent:'',innerHTML:'',classList:{add(){},remove(){}},appendChild(){}});
 const document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},querySelectorAll(){return [];},createElement:element,addEventListener(){}};
 const requests=[];const c=vm.createContext({document,window:{location:{}},Prep:{session:()=>({correo:'fixture@example.test'}),escapeHTML:x=>x},fetch:()=>new Promise(resolve=>requests.push(resolve)),console,setTimeout,clearTimeout});
 vm.runInContext(fs.readFileSync('frontend/js/panel-profesor.js','utf8'),c);
 const a=vm.runInContext("seleccionarClase(1,'A')",c),b=vm.runInContext("seleccionarClase(2,'B')",c);
 const response=nombre=>({json:async()=>({success:true,estudiantes:[{nombre,correo:'fixture@example.test',puntaje:10}]})});
 requests[1](response('B'));await b;requests[0](response('A'));await a;
 assert.equal(vm.runInContext('listaEstudiantesOriginal[0].nombre',c),'B');
});
test('Regresión: cola conserva varios UUID, reintenta y aísla cuentas',async()=>{
 const values=new Map([['datosVisionales',JSON.stringify({id_usuario:1,correo:'fixture@example.test'})]]);
 const localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 let offline=true,calls=0;const listeners={};
 const window={addEventListener:(k,fn)=>{listeners[k]=fn;}};
 const c=vm.createContext({window,localStorage,sessionStorage:{removeItem(){}},document:{addEventListener(){},querySelectorAll:()=>[]},fetch:async()=>{calls++;if(offline)throw Error('offline');return {ok:true,json:async()=>({success:true})};},console,URL,Headers});
 vm.runInContext(fs.readFileSync('frontend/js/prep.js','utf8'),c);const prep=window.Prep;
 prep.queueResult({id_resultado:'a'});prep.queueResult({id_resultado:'b'});
 await assert.rejects(prep.syncResults());assert.ok(prep.hasPendingResult('a'));assert.ok(prep.hasPendingResult('b'));
 offline=false;await prep.syncResults();assert.equal(prep.hasPendingResult('a'),false);assert.equal(prep.hasPendingResult('b'),false);assert.equal(calls,3);
 prep.queueResult({id_resultado:'c'});localStorage.setItem('datosVisionales',JSON.stringify({id_usuario:2}));await prep.syncResults();assert.equal(calls,3);assert.ok(prep.hasPendingResult('c'));assert.equal(typeof listeners.online,'function');
});
