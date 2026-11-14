async function cargarClases() {
  try {
    const data = await Prep.api('/api/clases');
    const list = document.getElementById('listaClases');
    list.replaceChildren();
    for (const clase of data.clases) {
      const item = document.createElement('li');
      item.textContent = clase.nombre_clase + ' - Código: ' + clase.codigo_acceso;
      list.appendChild(item);
    }
  } catch (error) { document.getElementById('mensajeClase').textContent = error.message; }
}
async function crearClase() {
  try {
    await Prep.api('/api/clases', { method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ nombre_clase: document.getElementById('nombreClase').value }) });
    document.getElementById('mensajeClase').textContent = 'Clase creada.';
    await cargarClases();
  } catch (error) { document.getElementById('mensajeClase').textContent = error.message; }
}
document.addEventListener('DOMContentLoaded', cargarClases);
