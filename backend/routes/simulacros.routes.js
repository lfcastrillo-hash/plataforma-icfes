const router = require('express').Router();
const auth = require('../middlewares/verificarToken');
const { role } = require('../middlewares/access');
const { fail } = require('../lib/validation');
const { BANCOS, CONFIG_AREAS } = require('../../frontend/js/banco-simulacro');
const { score } = require('../../frontend/js/simulacro-core');
router.post('/simulacros', auth, role('estudiante'), async (req, res) => {
  const { id_resultado, modalidad, respuestas, segundos } = req.body;
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id_resultado || '')
    || !['general','area','temas'].includes(modalidad) || !Array.isArray(respuestas) || !respuestas.length || respuestas.length > 200
    || !Number.isInteger(segundos) || segundos < 0 || segundos > 86400) return fail(res, 400, 'Resultado inválido.');
  const questions = [], answers = [], seen = new Set();
  for (const r of respuestas) {
    const match = typeof r?.id === 'string' && r.id.match(/^(matematicas|lectura|ciencias|sociales|ingles):(\d+)$/);
    const p = match && BANCOS[match[1]][Number(match[2])];
    if (!p || seen.has(r.id) || (r.seleccionada !== null && (!Number.isInteger(r.seleccionada) || r.seleccionada < 0 || r.seleccionada >= p.opciones.length))) return fail(res, 400, 'Pregunta o respuesta inválida.');
    seen.add(r.id); questions.push({ ...p, area: match[1] });
    answers.push({ idx: answers.length, seleccionada: r.seleccionada, omitida: r.seleccionada === null });
  }
  const resultado = { ...score(questions, answers, CONFIG_AREAS), segundos, respuestas };
  const pool = req.app.locals.pool;
  const inserted = await pool.query(`INSERT INTO resultados_simulacro(id_resultado,id_usuario,modalidad,resultado) VALUES($1,$2,$3,$4)
    ON CONFLICT(id_resultado) DO NOTHING RETURNING id_resultado`, [id_resultado, req.usuario.id_usuario, modalidad, JSON.stringify(resultado)]);
  if (!inserted.rows.length) {
    const existing = await pool.query('SELECT resultado FROM resultados_simulacro WHERE id_resultado=$1 AND id_usuario=$2', [id_resultado,req.usuario.id_usuario]);
    if (!existing.rows.length) return fail(res, 409, 'Identificador de resultado no disponible.');
    return res.json({ success:true, resultado:existing.rows[0].resultado });
  }
  res.status(201).json({ success:true, resultado });
});
router.get('/simulacros', auth, role('estudiante'), async (req,res) => {
  const result = await req.app.locals.pool.query('SELECT id_resultado,fecha,modalidad,resultado FROM resultados_simulacro WHERE id_usuario=$1 ORDER BY fecha DESC LIMIT 50', [req.usuario.id_usuario]);
  res.json({ success:true, resultados:result.rows });
});
module.exports = router;
