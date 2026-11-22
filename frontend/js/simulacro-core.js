(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SimulacroCore = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  function score(questions, answers, config) {
    if (!Array.isArray(questions) || !questions.length) throw new Error('Simulacro sin preguntas.');
    const porArea = {}, puntajesArea = {};
    let totalCorrectas = 0, totalOmitidas = 0;
    questions.forEach((p, i) => {
      const r = answers.find(r => r.idx === i);
      const omitida = !r || r.omitida || r.seleccionada === null;
      const correcta = !omitida && r.seleccionada === p.correcta;
      porArea[p.area] ||= { total: 0, correctas: 0 };
      porArea[p.area].total++;
      if (correcta) { porArea[p.area].correctas++; totalCorrectas++; }
      if (omitida) totalOmitidas++;
    });
    let sum = 0, weights = 0;
    for (const [area, stats] of Object.entries(porArea)) {
      const ratio = stats.correctas / stats.total;
      const weight = config[area]?.peso || 0.2;
      puntajesArea[area] = { p100: Math.round(ratio * 100), p500: Math.round(ratio * 500) };
      sum += ratio * 500 * weight; weights += weight;
    }
    return { porArea, puntajesArea, puntajeGlobal: Math.round(sum / weights), totalCorrectas,
      totalOmitidas, totalIncorrectas: questions.length - totalCorrectas - totalOmitidas,
      porcentaje: Math.round(totalCorrectas / questions.length * 100) };
  }
  function validConfig(cfg, banks) {
    if (!cfg || typeof cfg !== 'object') return false;
    if (cfg.tipo === 'general') return true;
    if (cfg.tipo === 'area') return Object.hasOwn(banks, cfg.area);
    return cfg.tipo === 'temas' && Array.isArray(cfg.temas) && cfg.temas.length > 0 && cfg.temas.length <= 25
      && cfg.temas.every(t => t && Object.hasOwn(banks, t.area) && banks[t.area].some(p => p.tema === t.tema));
  }
  function validAttempt(state, config, banks) {
    if (state?.config !== JSON.stringify(config) || !Array.isArray(state.ids) || !state.ids.length || state.ids.length > 200
      || new Set(state.ids).size !== state.ids.length || !Number.isInteger(state.idx) || state.idx < 0 || state.idx > state.ids.length
      || !Number.isInteger(state.seconds) || state.seconds < 0 || state.seconds > 86400 || !Array.isArray(state.answers)
      || typeof state.finished !== 'boolean'
      || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(state.resultId || '')) return false;
    const questions = state.ids.map(id => {
      const m = typeof id === 'string' && /^(matematicas|lectura|ciencias|sociales|ingles):(\d+)$/.exec(id);
      return m && banks[m[1]]?.[Number(m[2])];
    });
    if (questions.some(q=>!q)) return false;
    const seen = new Set();
    for (const r of state.answers) {
      if (!r || !Number.isInteger(r.idx) || r.idx < 0 || r.idx >= state.idx || seen.has(r.idx)
        || (r.seleccionada !== null && (!Number.isInteger(r.seleccionada) || r.seleccionada < 0 || r.seleccionada >= questions[r.idx].opciones.length))) return false;
      seen.add(r.idx);
    }
    return state.selected === null || (state.idx < questions.length && Number.isInteger(state.selected)
      && state.selected >= 0 && state.selected < questions[state.idx].opciones.length);
  }
  return { score, validConfig, validAttempt };
});
