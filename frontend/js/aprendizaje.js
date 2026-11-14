// Control compartido. El contenido y los handlers de cada ejercicio se conservan.
const area = document.currentScript.dataset.area;
const prefix = {matematicas:'mat',lectura:'lec',ciencias:'cie',sociales:'soc',ingles:'ing'}[area];
const sesion = Prep.session();
const learningStorage = Prep.forUser(sesion);
if (!sesion.correo) window.location.href = "index.html"; 
      const TOTAL_TEMAS = 5;
      const PREGUNTAS_POR_TEMA = 8;
      let progresoHistorico = 0;
      const savedTopics = Prep.parse(learningStorage.getItem(prefix + '_completados'), []);
      const savedAnswers = Prep.parse(learningStorage.getItem(prefix + '_correctas'), {});
      let temasCompletados = Array.isArray(savedTopics) ? savedTopics.filter(t=>Number.isInteger(t)&&t>=0&&t<5) : [];
      let preguntasCorrectas = savedAnswers && typeof savedAnswers==='object' && !Array.isArray(savedAnswers)
        ? Object.fromEntries(Object.entries(savedAnswers).filter(([key,value])=>value===true&&document.getElementById('ej-'+key))) : {};

      window.addEventListener('DOMContentLoaded', async () => {
        try {
          const data = await Prep.api('/api/progreso-areas/'+encodeURIComponent(sesion.correo));
          progresoHistorico = Math.max(0, Math.min(100, Number(data.areas?.[area]) || 0));
          const state = data.estados?.[area];
          if (state) {
            preguntasCorrectas={...preguntasCorrectas,...(state.correctas||{})};
            temasCompletados=[...new Set([...temasCompletados,...(state.completados||[])])];
            learningStorage.setItem(prefix+'_correctas',JSON.stringify(preguntasCorrectas));
            learningStorage.setItem(prefix+'_completados',JSON.stringify(temasCompletados));
          }
        } catch(error) { console.warn('Se conserva el avance local:',error.message); }

        temasCompletados.forEach(idx => marcarUICompletado(idx));
        Object.keys(preguntasCorrectas).forEach(key => {
          const [tema, ejercicio] = key.split('-');
          const card = document.getElementById(`ej-${tema}-${ejercicio}`);
          if (card) {
            card.querySelectorAll('.opcion-btn').forEach(b => {
              b.disabled = true;
              b.style.cursor = 'default';
              if (b.getAttribute('onclick') && b.getAttribute('onclick').includes('true')) b.classList.add('correcta');
            });
            const feedback = document.getElementById(`fb-${tema}-${ejercicio}`);
            if (feedback) { feedback.classList.add('correcto'); feedback.style.display = 'block'; }
          }
        });
        actualizarProgreso();
        actualizarBotonesCompletar();
        document.documentElement.dataset.learningReady='true';
        if(Object.keys(preguntasCorrectas).length)guardarProgresoAreaDB(calcularProgresoArea());
      });

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

      let syncQueue = Promise.resolve();
      function guardarProgresoAreaDB(pct) {
        if(!Prep.sameSession(sesion))return Promise.resolve();
        // Serializar las escrituras evita invertir el orden de respuestas de red.
        const estado = {correctas:{...preguntasCorrectas},completados:[...temasCompletados]};
        syncQueue = syncQueue.catch(()=>{}).then(()=>Prep.api('/api/progreso-area', {
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({area,progreso:pct,estado})
        })).then(()=>{document.documentElement.dataset.progressSync='saved';}).catch(error=>{
          document.documentElement.dataset.progressSync='pending';console.warn('Avance conservado localmente; sincronización pendiente:',error.message);
        });
        return syncQueue;
      }

      async function responder(btn, tema, ejercicio, esCorrecta) {
        if(!Prep.sameSession(sesion) || btn.disabled || document.documentElement.dataset.learningReady!=='true') return;
        const card = document.getElementById(`ej-${tema}-${ejercicio}`);
        const feedback = document.getElementById(`fb-${tema}-${ejercicio}`);
        const botones = card.querySelectorAll('.opcion-btn');
        botones.forEach(b => { b.disabled = true; b.style.cursor = 'default'; });
        if (esCorrecta) {
          btn.classList.add('correcta');
          feedback.classList.add('correcto');
          const key = `${tema}-${ejercicio}`;
          if (!preguntasCorrectas[key]) {
            preguntasCorrectas[key] = true;
            learningStorage.setItem(prefix + '_correctas', JSON.stringify(preguntasCorrectas));
            const pct = calcularProgresoArea();
            actualizarProgreso();
            await guardarProgresoAreaDB(pct);
          }
        } else {
          btn.classList.add('incorrecta');
          feedback.classList.add('incorrecto');
          botones.forEach(b => {
            if (b.getAttribute('onclick') && b.getAttribute('onclick').includes('true')) b.classList.add('correcta');
          });
        }
        feedback.style.display = 'block';
        actualizarBotonesCompletar();
      }

      async function completarTema(idx) {
        if(!Prep.sameSession(sesion))return;
        if (temasCompletados.includes(idx)) return;
        if (correctasTema(idx) < PREGUNTAS_POR_TEMA) return;
        temasCompletados.push(idx);
        learningStorage.setItem(prefix + '_completados', JSON.stringify(temasCompletados));
        marcarUICompletado(idx);
        const pct = calcularProgresoArea();
        actualizarProgreso();
        await guardarProgresoAreaDB(pct);
        if (temasCompletados.length === TOTAL_TEMAS)
          document.getElementById('moduloCompletado').style.display = 'block';
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
