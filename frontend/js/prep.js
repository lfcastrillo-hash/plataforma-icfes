(function (global) {
  'use strict';
  const parse = (raw, fallback) => { try { return JSON.parse(raw) ?? fallback; } catch { return fallback; } };
  function session() { return parse(localStorage.getItem('datosVisionales') || localStorage.getItem('usuarioActivo'), {}); }
  function prefix(user = session()) {
    return 'prepicfes:u:' + (user.id_usuario || user.correo || 'anonymous') + ':';
  }
  const storage = {
    getItem: key => localStorage.getItem(prefix() + key),
    setItem: (key, value) => localStorage.setItem(prefix() + key, value),
  };
  function forUser(user) {
    const base = prefix(user);
    return { getItem:key=>localStorage.getItem(base+key), setItem:(key,value)=>localStorage.setItem(base+key,value), removeItem:key=>localStorage.removeItem(base+key) };
  }
  const pageUser = session();
  function sameSession(user = pageUser) {
    const now = session();
    return String(now.id_usuario || now.correo || '') === String(user.id_usuario || user.correo || '');
  }
  // Una pestaña abierta con otra cuenta no puede escribir sobre la sesión nueva.
  if (typeof global.fetch === 'function') {
    const nativeFetch = global.fetch.bind(global);
    global.fetch = (input, options = {}) => {
      const url = new URL(typeof input === 'string' ? input : input.url, location.href);
      if (url.origin === location.origin && url.pathname.startsWith('/api/') && !['/api/login','/api/registro','/api/health'].includes(url.pathname)) {
        if (!sameSession()) return Promise.reject(new Error('La cuenta cambió en otra pestaña. Recarga esta página.'));
        const headers = new Headers(options.headers || (typeof input === 'object' ? input.headers : undefined));
        if (pageUser.id_usuario) headers.set('X-Prep-User', String(pageUser.id_usuario));
        options = { ...options, headers };
        return nativeFetch(input, options).then(response => {
          if (!sameSession()) throw new Error('La cuenta cambió durante la solicitud. Recarga esta página.');
          return response;
        });
      }
      return nativeFetch(input, options);
    };
  }
  async function api(path, options = {}) {
    const response = await fetch(path, { credentials: 'include', ...options });
    const data = await response.json();
    if (!response.ok) { const error=new Error(data.mensaje || data.error || 'No se pudo completar la operación.');error.status=response.status;throw error; }
    return data;
  }
  function clearSession() {
    ['datosVisionales', 'usuarioActivo', 'token', 'id_usuario'].forEach(key => localStorage.removeItem(key));
    sessionStorage.removeItem('simulacro_config');
  }
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href]').forEach(a => {
      if (/^(LINK_|pdfs\/)/.test(a.getAttribute('href'))) a.addEventListener('click', event => {
        event.preventDefault(); alert('Este recurso todavía no está disponible. Solicítalo a tu profesor.');
      });
    });
  });
  function importLegacyProgress() {
    const user = session();
    if (!user.id_usuario) throw new Error('Inicia sesión e identifica al propietario antes de importar.');
    for (const area of ['mat', 'lec', 'cie', 'soc', 'ing']) {
      for (const suffix of ['correctas', 'completados']) {
        const key = area + '_' + suffix;
        const legacy = localStorage.getItem(key);
        if (legacy && !storage.getItem(key)) storage.setItem(key, legacy);
      }
    }
    // Los originales se conservan. Ejecutar solo tras confirmar quién es el propietario.
  }
  global.Prep = { parse, session, storage, forUser, sameSession, api, clearSession, escapeHTML, importLegacyProgress };
})(window);
