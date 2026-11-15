const { database } = require('./database.cjs');
const { createApp } = require('../../backend/server');
async function fixture(options = {}) {
  const pool = await database(options);
  const app = createApp({ pool, rateLimitOptions: { limit: 10000 }, accountLimitOptions:{profile:{limit:10000}}, ...options });
  const server = await new Promise(resolve => { const s = app.listen(options.port || 0,'127.0.0.1',()=>resolve(s)); });
  const base = 'http://127.0.0.1:' + server.address().port;
  async function request(url, { method = 'GET', body, cookie, headers = {} } = {}) {
    const form = body instanceof FormData;
    const response = await fetch(base + '/api' + url, { method,
      headers: { ...(body && !form ? { 'Content-Type':'application/json' } : {}), ...(cookie ? { Cookie:cookie } : {}), ...headers },
      body: body === undefined ? undefined : form ? body : JSON.stringify(body) });
    return { status:response.status, data: await response.json(), cookie:response.headers.get('set-cookie')?.split(';')[0], headers:response.headers };
  }
  async function register(correo, rol = 'estudiante', password = 'Prueba123!') {
    return request('/registro', { method:'POST', body:{ nombre:'Usuario QA', correo, password, rol } });
  }
  async function login(correo, rol = 'estudiante', password = 'Prueba123!') {
    return request('/login', { method:'POST', body:{ correo, password, rol } });
  }
  return { app, pool, base, request, register, login,
    close: async () => { await new Promise(resolve => server.close(resolve)); await pool.end(); } };
}
module.exports = { fixture };
