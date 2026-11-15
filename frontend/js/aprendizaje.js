// Estado visual cacheado por usuario; el servidor acredita cada respuesta.
const area=document.currentScript.dataset.area;
const prefix={matematicas:'mat',lectura:'lec',ciencias:'cie',sociales:'soc',ingles:'ing'}[area];
const sesion=Prep.session();
const learningStorage=Prep.forUser(sesion);
if(!sesion.correo)window.location.href='index.html';
const TOTAL_TEMAS=5, PREGUNTAS_POR_TEMA=8;
let progresoHistorico=0;
const savedTopics=Prep.parse(learningStorage.getItem(prefix+'_completados'),[]);
const savedAnswers=Prep.parse(learningStorage.getItem(prefix+'_correctas'),{});
let temasCompletados=Array.isArray(savedTopics)?savedTopics.filter(t=>Number.isInteger(t)&&t>=0&&t<5):[];
let preguntasCorrectas=savedAnswers&&typeof savedAnswers==='object'&&!Array.isArray(savedAnswers)
 ?Object.fromEntries(Object.entries(savedAnswers).filter(([k,v])=>v===true&&document.getElementById('ej-'+k))):{};
// Conservar el caché anterior para revisión; nunca se acredita por enviarlo al servidor.
if(!learningStorage.getItem(prefix+'_cache_anterior')&&(Object.keys(preguntasCorrectas).length||temasCompletados.length))
 learningStorage.setItem(prefix+'_cache_anterior',JSON.stringify({correctas:preguntasCorrectas,completados:temasCompletados}));
let pending=Prep.parse(learningStorage.getItem(prefix+'_pendientes'),[]);
if(!Array.isArray(pending))pending=[];
pending=pending.filter(p=>p&&typeof p.id==='string'&&p.action&&typeof p.action==='object').slice(0,80);
let syncQueue=Promise.resolve();
function cacheCanonical(data){
 preguntasCorrectas=data.estado?.correctas||{};
 temasCompletados=data.estado?.completados||[];
 progresoHistorico=Math.max(0,Math.min(100,Number(data.progreso)||0));
 learningStorage.setItem(prefix+'_correctas',JSON.stringify(preguntasCorrectas));
 learningStorage.setItem(prefix+'_completados',JSON.stringify(temasCompletados));
}
function savePending(){learningStorage.setItem(prefix+'_pendientes',JSON.stringify(pending));}
async function sendPending(entry){
 if(!Prep.sameSession(sesion))return null;
 try{
  const data=await Prep.api('/api/progreso-area',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({area,...entry.action})});
  pending=pending.filter(p=>p.id!==entry.id);savePending();cacheCanonical(data);
  document.documentElement.dataset.progressSync=pending.length?'pending':'saved';return data;
 }catch(error){
  if(error.status&&error.status<500&&error.status!==429){pending=pending.filter(p=>p.id!==entry.id);savePending();}
  document.documentElement.dataset.progressSync='pending';console.warn('Respuesta no sincronizada:',error.message);return null;
 }
}
function submitAction(action){
 if(!Prep.sameSession(sesion))return Promise.resolve(null);
 const entry={id:crypto.randomUUID(),action};pending.push(entry);savePending();
 document.documentElement.dataset.progressSync='pending';
 const job=syncQueue.catch(()=>{}).then(()=>sendPending(entry));syncQueue=job;return job;
}
async function replayPending(){
 for(const entry of [...pending]){const data=await sendPending(entry);if(!data&&pending.some(p=>p.id===entry.id))break;}
}
function restoreCorrectUI(){
 temasCompletados.forEach(idx=>marcarUICompletado(idx));
 Object.keys(preguntasCorrectas).forEach(key=>{
  const card=document.getElementById('ej-'+key);if(!card)return;
  card.querySelectorAll('.opcion-btn').forEach(b=>{b.disabled=true;b.style.cursor='default';if(b.getAttribute('onclick')?.includes('true'))b.classList.add('correcta');});
  const feedback=document.getElementById('fb-'+key);if(feedback){feedback.classList.add('correcto');feedback.style.display='block';}
 });
 actualizarProgreso();actualizarBotonesCompletar();
}
window.addEventListener('DOMContentLoaded',async()=>{
 try{const data=await Prep.api('/api/progreso-areas/'+encodeURIComponent(sesion.correo));cacheCanonical({estado:data.estados?.[area]||{correctas:{},completados:[]},progreso:data.areas?.[area]||0});}
 catch(error){console.warn('Se conserva el caché local para consulta:',error.message);}
 await replayPending();restoreCorrectUI();document.documentElement.dataset.learningReady='true';
});
window.addEventListener('online',()=>{syncQueue=syncQueue.catch(()=>{}).then(replayPending).then(restoreCorrectUI);});
      function mostrarTema(idx) {
        document.querySelectorAll('.tema-seccion').forEach(s => s.classList.remove('visible'));
        document.querySelectorAll('.temas-nav button').forEach(b => b.classList.remove('activo'));
        document.getElementById(`tema-${idx}`).classList.add('visible');
        document.getElementById(`btn-tema-${idx}`).classList.add('activo');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      function correctasTema(t) {
        return Object.keys(preguntasCorrectas).filter(k => k.startsWith(`${t}-`) && preguntasCorrectas[k]).length;
      }

      function calcularProgresoArea() {
        let totalCorrectas = 0;
        for (let t = 0; t < TOTAL_TEMAS; t++) {
          totalCorrectas += Math.min(correctasTema(t), PREGUNTAS_POR_TEMA);
        }
        return Math.max(progresoHistorico, Math.round((totalCorrectas / (TOTAL_TEMAS * PREGUNTAS_POR_TEMA)) * 100));
      }


async function responder(btn,tema,ejercicio,esCorrecta){
 if(!Prep.sameSession(sesion)||btn.disabled||document.documentElement.dataset.learningReady!=='true')return;
 const card=document.getElementById('ej-'+tema+'-'+ejercicio),feedback=document.getElementById('fb-'+tema+'-'+ejercicio);
 const botones=[...card.querySelectorAll('.opcion-btn')],opcion=botones.indexOf(btn);
 botones.forEach(b=>{b.disabled=true;b.style.cursor='default';});
 const result=await submitAction({respuesta:{tema,ejercicio,opcion}});
 // El feedback local sin conexión es orientativo; no acredita porcentaje en la base.
 const correcta=result?result.correcta:esCorrecta;
 if(correcta){btn.classList.add('correcta');feedback.classList.add('correcto');}
 else{btn.classList.add('incorrecta');feedback.classList.add('incorrecto');botones.forEach(b=>{if(b.getAttribute('onclick')?.includes('true'))b.classList.add('correcta');});}
 feedback.style.display='block';actualizarProgreso();actualizarBotonesCompletar();
}
async function completarTema(idx){
 if(!Prep.sameSession(sesion)||temasCompletados.includes(idx)||correctasTema(idx)<PREGUNTAS_POR_TEMA)return;
 const result=await submitAction({completarTema:idx});if(!result)return;
 marcarUICompletado(idx);actualizarProgreso();actualizarBotonesCompletar();
 if(temasCompletados.length===TOTAL_TEMAS)document.getElementById('moduloCompletado').style.display='block';
}
      function marcarUICompletado(idx) {
        const btn = document.getElementById(`btnCompletar-${idx}`);
        const badge = document.getElementById(`badge-${idx}`);
        const navBtn = document.getElementById(`btn-tema-${idx}`);
        if (btn) { btn.textContent = '✓ Tema completado'; btn.classList.add('ya-completado'); btn.disabled = true; }
        if (badge) badge.style.display = 'inline-block';
        if (navBtn) navBtn.classList.add('completado-nav');
      }

      function actualizarBotonesCompletar() {
        for (let t = 0; t < TOTAL_TEMAS; t++) {
          if (temasCompletados.includes(t)) continue;
          const btn = document.getElementById(`btnCompletar-${t}`);
          if (!btn) continue;
          const listas = correctasTema(t);
          const listo = listas >= PREGUNTAS_POR_TEMA;
          btn.disabled = !listo;
          btn.style.opacity = listo ? '1' : '0.4';
          btn.style.cursor = listo ? 'pointer' : 'not-allowed';
          btn.title = listo ? '' : `Responde todas las preguntas primero (${listas}/${PREGUNTAS_POR_TEMA})`;
        }
      }

      function actualizarProgreso() {
        const pct = calcularProgresoArea();
        const fill = document.getElementById('barraGlobal');
        const texto = document.getElementById('textoGlobal');
        if (fill) fill.style.width = pct + '%';
        if (texto) texto.textContent = `${temasCompletados.length} de ${TOTAL_TEMAS} temas completados`;
      }

      function toggleMenu() {
        const menu = document.getElementById('sidebar-menu');
        const btn = document.getElementById('btn-menu');
        if (menu) menu.classList.toggle('abierto');
        if (btn) btn.classList.toggle('active');
      }
