const { AREAS, percentage } = require('./validation');
function validateState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return false;
  const correctas = state.correctas === undefined ? {} : state.correctas;
  const completados = state.completados === undefined ? [] : state.completados;
  return correctas !== null && typeof correctas === 'object' && !Array.isArray(correctas) && Object.keys(correctas).length <= 40
    && Object.entries(correctas).every(([key, value]) => /^[0-4]-[0-7]$/.test(key) && value === true)
    && Array.isArray(completados) && new Set(completados).size === completados.length
    && completados.every(t => Number.isInteger(t) && t >= 0 && t < 5
      && Array.from({ length: 8 }, (_, i) => correctas[`${t}-${i}`]).every(Boolean));
}
function progressFromState(state) { return Math.round(Object.keys(state.correctas || {}).length / 40 * 100); }
function general(areas) { return Math.round(AREAS.reduce((sum, area) => sum + (Number(areas[area]) || 0), 0) / 5); }
async function applyAction(client, user, area, action) {
  const {catalog,topicKeys}=require('./catalogo-aprendizaje');
  // Bloquear por usuario cubre también la primera escritura y sincronizaciones concurrentes.
  await client.query('SELECT id_usuario FROM usuarios WHERE id_usuario=$1 FOR UPDATE', [user.id_usuario]);
  const previous = await client.query('SELECT progreso,estado FROM progreso_areas WHERE id_usuario=$1 AND area=$2', [user.id_usuario, area]);
  const old = previous.rows[0] || { progreso: 0, estado: {} };
  const correctas=Object.fromEntries(Object.entries(old.estado?.correctas||{}).filter(([key,value])=>catalog[area][key]&&value===true));
  const completados=[...new Set((Array.isArray(old.estado?.completados)?old.estado.completados:[]).filter(t=>Number.isInteger(t)&&t>=0&&t<5))];
  if(action.answer?.correcta)correctas[action.answer.key]=true;
  if(action.complete!==undefined){
    const keys=topicKeys(area,action.complete);
    if(keys.length!==8 || !keys.every(key=>correctas[key])){
      const error=new Error('Responde correctamente los ejercicios del tema antes de completarlo.');error.status=409;throw error;
    }
    if(!completados.includes(action.complete))completados.push(action.complete);
  }
  const merged={correctas,completados,schema:2};
  // No borrar el estado anterior ni reducir porcentajes históricos sin evidencias de sus respuestas.
  if(old.estado?.legacy!==undefined)merged.legacy=old.estado.legacy;
  else if(old.estado?.schema!==2 && Object.keys(old.estado||{}).length)merged.legacy=old.estado;
  const value=Math.max(Number(old.progreso),progressFromState(merged));
  if(!percentage(value))throw new Error('Progreso histórico fuera de rango; requiere revisión.');
  await client.query(`INSERT INTO progreso_areas (id_usuario,correo,area,progreso,estado) VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT (id_usuario,area) DO UPDATE SET correo=EXCLUDED.correo,
    progreso=EXCLUDED.progreso, estado=EXCLUDED.estado`,
    [user.id_usuario, user.correo, area, value, JSON.stringify(merged || {})]);
  return {success:true,progreso:value,estado:merged,...(action.answer?{correcta:action.answer.correcta}:{})};
}
module.exports = { validateState, progressFromState, general, applyAction };
