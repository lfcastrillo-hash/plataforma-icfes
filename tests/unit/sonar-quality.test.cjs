const {test}=require('node:test'),assert=require('node:assert/strict');
const {email}=require('../../backend/lib/validation');
test('Correo: mantiene dominio, longitud y rechazo de entradas peligrosas',()=>{
 for(const value of ['a@example.test',' a+b@example.co.test ','a.b@sub.example.test'])assert.equal(email(value),true,value);
 for(const value of ['',null,{},'a@@example.test','a@example','a@.test','a@example.','a b@example.test','a<@example.test','a@exam ple.test','a'.repeat(255)+'@e.test'])assert.equal(email(value),false,String(value));
});
test('Perfil compartido: FormData, identidad y mensajes conservados',async()=>{
 const vm=require('node:vm'),fs=require('node:fs'),values=new Map();let reloads=0,notice,body;
 const user={id_usuario:1,correo:'old@example.test'};values.set('datosVisionales',JSON.stringify(user));
 const window={location:{reload:()=>reloads++}};
 const context=vm.createContext({window,localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},document:{addEventListener(){}},console,alert:m=>{notice=m;},fetch:async(url,options)=>{assert.equal(url,'/api/perfil/actualizar');body=options.body;return {ok:true,json:async()=>({correo:'new@example.test',nombre:'QA'})};}});
 vm.runInContext(fs.readFileSync('frontend/js/prep.js','utf8'),context);
 const form={fixture:true};await window.Prep.updateProfile(form,user,'Guardado');
 assert.equal(body,form);assert.equal(reloads,1);assert.equal(notice,'Guardado');assert.equal(JSON.parse(values.get('datosVisionales')).correo,'new@example.test');
});
