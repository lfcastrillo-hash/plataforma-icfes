const { test }=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function storage(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
test('M2 aislamiento en el mismo navegador, datos dañados y compatibilidad sin adjudicar dueño',()=>{
 const localStorage=storage(),sessionStorage=storage();
 const window={};const ctx={window,localStorage,sessionStorage,document:{addEventListener:()=>{}}};
 vm.runInNewContext(fs.readFileSync('frontend/js/prep.js','utf8'),ctx);const p=window.Prep;
 localStorage.setItem('datosVisionales','{invalid');assert.equal(p.session().correo,undefined);
 localStorage.setItem('mat_correctas','{"0-0":true}');
 localStorage.setItem('datosVisionales','{"id_usuario":1,"correo":"a@example.test"}');
 assert.equal(p.storage.getItem('mat_correctas'),null);p.storage.setItem('mat_correctas','{"0-1":true}');
 const pinned=p.forUser(p.session());
 p.clearSession();localStorage.setItem('datosVisionales','{"id_usuario":2,"correo":"b@example.test"}');
 assert.equal(p.storage.getItem('mat_correctas'),null);
 pinned.setItem('tab-antigua','A');assert.equal(p.storage.getItem('tab-antigua'),null);
 assert.equal(p.sameSession({id_usuario:1}),false);
 p.importLegacyProgress();assert.equal(p.storage.getItem('mat_correctas'),'{"0-0":true}');
 assert.equal(localStorage.getItem('mat_correctas'),'{"0-0":true}');
 localStorage.setItem('datosVisionales','{"id_usuario":1,"correo":"nuevo@example.test"}');
 assert.equal(p.storage.getItem('mat_correctas'),'{"0-1":true}');
 assert.equal(p.escapeHTML('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;');
});
