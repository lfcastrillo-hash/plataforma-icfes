/* ==========================================================================
   dashboard-profesor.js
   Lógica del panel del profesor: sesión, modales, tabla, stats, búsquedas, filtros,
   anuncios del muro y ordenamiento dinámico por columnas.
   ========================================================================== */
const API = "http://localhost:3000/api";

// ── Sesión ──────────────────────────────────────────────────────────────────
const sesion = JSON.parse(localStorage.getItem("datosVisionales") || "{}");

if (!sesion.correo) {
  window.location.href = "index.html";
}

// ── Helper: headers con token ────────────────────────────────────────────────
function getAuthHeaders(extraHeaders = {}) {
  const token = sesion.token || "";
  const base = token ? { Authorization: `Bearer ${token}` } : {};
  return { ...base, ...extraHeaders };
}

// Muestra el nombre/avatar en la navbar
document.addEventListener("DOMContentLoaded", async () => {
  const correo = sesion.correo || "";
  const SERVER_URL = "http://localhost:3000";

  document.getElementById("nav-nombre-profesor").textContent = correo;

  try {
    const response = await fetch(
      `${API}/perfil/${encodeURIComponent(correo)}`,
      {
        credentials: "include",
        headers: getAuthHeaders(),
      },
    );

    if (response.ok) {
      const usuario = await response.json();

      if (usuario.foto_perfil) {
        document.getElementById("nav-avatar-img").src =
          `${SERVER_URL}${usuario.foto_perfil}`;
        document.getElementById("nav-avatar-img").style.display = "block";
        document.getElementById("nav-avatar-text").style.display = "none";
      } else {
        document.getElementById("nav-avatar-text").textContent = usuario.nombre
          .charAt(0)
          .toUpperCase();
      }
      document.getElementById("nav-nombre-profesor").textContent =
        usuario.nombre;
    }
  } catch (err) {
    console.error("Error cargando navbar del perfil:", err);
  }

  await cargarClasesSidebar();
});

// Variables de estado
let claseActivaId = null;
let claseActivaNombre = "";
let listaClasesOriginal = [];
let listaEstudiantesOriginal = [];
let direccionOrden = { nombre: "asc", puntaje: "asc" };

// ══════════════════════════════════════════════════════════════════════════════
// SIDEBAR: cargar clases del profesor
// ══════════════════════════════════════════════════════════════════════════════
async function cargarClasesSidebar() {
  try {
    const res = await fetch(
      `${API}/clases?correo=${encodeURIComponent(sesion.correo)}`,
      {
        credentials: "include",
        headers: getAuthHeaders(),
      },
    );
    const data = await res.json();

    if (!data.success || data.clases.length === 0) {
      mostrarEstadoVacio();
      return;
    }

    listaClasesOriginal = data.clases;
    renderizarClasesSidebar(listaClasesOriginal);

    if (
      !claseActivaId ||
      !listaClasesOriginal.some((c) => c.id_clase === claseActivaId)
    ) {
      const primera = listaClasesOriginal[0];
      const primerEnlace =
        document.getElementById("listaClasesSidebar").firstChild;
      await seleccionarClase(
        primera.id_clase,
        primera.nombre_clase,
        primerEnlace,
      );
    }
  } catch (err) {
    console.error("Error cargando clases:", err);
    mostrarToast("Error al conectar con el servidor.", "error");
  }
}

function renderizarClasesSidebar(clases) {
  const nav = document.getElementById("listaClasesSidebar");
  nav.innerHTML = "";

  clases.forEach((clase) => {
    const a = document.createElement("a");
    a.href = "#";
    a.className =
      "nav-item" + (claseActivaId === clase.id_clase ? " activa" : "");
    a.textContent = `Grupo ${clase.nombre_clase}`;
    a.onclick = (e) => {
      e.preventDefault();
      seleccionarClase(clase.id_clase, clase.nombre_clase, a);
    };
    nav.appendChild(a);
  });
}

function filtrarClasesSidebar(texto) {
  const query = texto.toLowerCase().trim();
  const clasesFiltradas = listaClasesOriginal.filter((clase) =>
    clase.nombre_clase.toLowerCase().includes(query),
  );
  renderizarClasesSidebar(clasesFiltradas);
}

// ══════════════════════════════════════════════════════════════════════════════
// SELECCIONAR CLASE (Carga estudiantes y sincroniza el Muro de Anuncios)
// ══════════════════════════════════════════════════════════════════════════════
async function seleccionarClase(idClase, nombreClase, elementoNav) {
  claseActivaId = idClase;
  claseActivaNombre = nombreClase;

  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("activa"));

  if (elementoNav) {
    elementoNav.classList.add("activa");
  } else {
    const enlaces = document.querySelectorAll(".nav-item");
    enlaces.forEach((a) => {
      if (a.textContent === `Grupo ${nombreClase}`) a.classList.add("activa");
    });
  }

  document.getElementById("estado-vacio").style.display = "none";
  document.getElementById("contenido-clase").style.display = "block";
  document.getElementById("tituloClase").textContent = `Grupo ${nombreClase}`;
  document.getElementById("busquedaEstudiantes").value = "";

  document.getElementById("icon-sort-nombre").textContent = "⇅";
  document.getElementById("icon-sort-puntaje").textContent = "⇅";

  await cargarEstudiantesDeClase(idClase);
}

// ══════════════════════════════════════════════════════════════════════════════
// POST-IT: PUBLICAR ANUNCIO EN EL MURO (MODAL)
// ══════════════════════════════════════════════════════════════════════════════
function abrirModalAnuncio() {
  document.getElementById("texto-anuncio").value = "";
  abrirModal("modal-anuncio");
}

async function guardarAnuncio() {
  if (!claseActivaId)
    return mostrarToast("Selecciona una clase primero.", "error");

  const textoAnuncio = document.getElementById("texto-anuncio").value;

  try {
    const response = await fetch(`${API}/clases/${claseActivaId}/anuncio`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
      body: JSON.stringify({ anuncio: textoAnuncio }),
    });

    if (response.ok) {
      mostrarToast("¡Anuncio publicado con éxito!", "success");
      cerrarModal("modal-anuncio");
    } else {
      mostrarToast("Error al publicar anuncio", "error");
    }
  } catch (error) {
    console.error("Error guardando el anuncio:", error);
    mostrarToast("Error de conexión al guardar el anuncio.", "error");
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CARGAR ESTUDIANTES DE UNA CLASE
// ══════════════════════════════════════════════════════════════════════════════
async function cargarEstudiantesDeClase(idClase) {
  try {
    const res = await fetch(`${API}/clases/${idClase}/estudiantes`, {
      credentials: "include",
      headers: getAuthHeaders(),
    });
    const data = await res.json();

    if (!data.success) {
      mostrarToast("No se pudieron cargar los estudiantes.", "error");
      return;
    }

    listaEstudiantesOriginal = data.estudiantes || [];
    renderizarTabla(listaEstudiantesOriginal);
    actualizarStats(listaEstudiantesOriginal);
  } catch (err) {
    console.error("Error cargando estudiantes:", err);
    mostrarToast("Error de conexión.", "error");
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ORDENACIÓN DINÁMICA DE COLUMNAS (Frontend 100%)
// ══════════════════════════════════════════════════════════════════════════════
function ordenarColumna(columna) {
  const direccion = direccionOrden[columna] === "asc" ? "desc" : "asc";
  direccionOrden[columna] = direccion;

  document.getElementById("icon-sort-nombre").textContent = "⇅";
  document.getElementById("icon-sort-puntaje").textContent = "⇅";

  document.getElementById(`icon-sort-${columna}`).textContent =
    direccion === "asc" ? "▲" : "▼";

  listaEstudiantesOriginal.sort((a, b) => {
    let valorA = columna === "nombre" ? a.nombre.toLowerCase() : a.puntaje || 0;
    let valorB = columna === "nombre" ? b.nombre.toLowerCase() : b.puntaje || 0;

    if (valorA < valorB) return direccion === "asc" ? -1 : 1;
    if (valorA > valorB) return direccion === "asc" ? 1 : -1;
    return 0;
  });

  renderizarTabla(listaEstudiantesOriginal);
}

// ══════════════════════════════════════════════════════════════════════════════
// RENDERIZAR TABLA
// ══════════════════════════════════════════════════════════════════════════════
function renderizarTabla(estudiantes) {
  const tbody = document.getElementById("tablaEstudiantes");
  const msgVacio = document.getElementById("tabla-vacia");
  tbody.innerHTML = "";

  if (estudiantes.length === 0) {
    msgVacio.style.display = "block";
    return;
  }

  msgVacio.style.display = "none";
  estudiantes.forEach((est, i) => {
    const pct = est.puntaje || 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="color:#aaa; font-weight:600;">${i + 1}</td>
      <td><strong>${est.nombre}</strong></td>
      <td style="color:#888;">${est.correo}</td>
      <td>
        <div class="progreso-celda">
          <div class="barra-fondo">
            <div class="barra-llena" style="width:${pct}%;"></div>
          </div>
          <span class="porcentaje-texto">${pct}%</span>
        </div>
      </td>
      <td class="col-accion">
        <button class="btn-danger" title="Eliminar estudiante" onclick="confirmarEliminarEstudiante('${est.correo}')">✕</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function actualizarStats(estudiantes) {
  const total = estudiantes.length;
  const promedio =
    total > 0
      ? Math.round(
          estudiantes.reduce((s, e) => s + (e.puntaje || 0), 0) / total,
        )
      : 0;
  const top =
    total > 0
      ? estudiantes
          .reduce((a, b) => ((b.puntaje || 0) > (a.puntaje || 0) ? b : a))
          .nombre.split(" ")[0]
      : "—";

  document.getElementById("statTotal").textContent = total;
  document.getElementById("statPromedio").textContent = promedio + "%";
  document.getElementById("statTop").textContent = top;
}

function mostrarEstadoVacio() {
  document.getElementById("estado-vacio").style.display = "block";
  document.getElementById("contenido-clase").style.display = "none";
  document.getElementById("listaClasesSidebar").innerHTML = "";
}

// ══════════════════════════════════════════════════════════════════════════════
// MODALES ACCIONES
// ══════════════════════════════════════════════════════════════════════════════
function abrirModalCrearClase() {
  document.getElementById("input-nombre-clase").value = "";
  ocultarError("error-crear-clase");
  abrirModal("modal-crear-clase");
}

async function crearClase() {
  const nombre = document.getElementById("input-nombre-clase").value.trim();
  if (!nombre) {
    mostrarError("error-crear-clase", "El nombre no puede estar vacío.");
    return;
  }

  try {
    const res = await fetch(`${API}/clases`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
      body: JSON.stringify({
        nombre_clase: nombre,
        correo_profesor: sesion.correo,
      }),
    });
    const data = await res.json();

    if (!data.success) {
      mostrarError("error-crear-clase", data.mensaje);
      return;
    }

    cerrarModal("modal-crear-clase");
    mostrarToast(`Clase "${nombre}" creada con éxito.`, "success");
    await cargarClasesSidebar();
  } catch {
    mostrarError("error-crear-clase", "Error de conexión con el servidor.");
  }
}

function abrirModalAgregarEstudiante() {
  document.getElementById("input-correo-estudiante").value = "";
  ocultarError("error-agregar-estudiante");
  abrirModal("modal-agregar-estudiante");
}

async function agregarEstudiante() {
  const correo = document
    .getElementById("input-correo-estudiante")
    .value.trim();
  if (!correo) {
    mostrarError("error-agregar-estudiante", "Ingresa un correo válido.");
    return;
  }

  try {
    const res = await fetch(`${API}/inscripciones/agregar`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
      body: JSON.stringify({ email: correo, id_clase: claseActivaId }),
    });
    const data = await res.json();

    if (!data.success) {
      mostrarError("error-agregar-estudiante", data.mensaje);
      return;
    }

    cerrarModal("modal-agregar-estudiante");
    mostrarToast("Estudiante agregado correctamente.", "success");
    await cargarEstudiantesDeClase(claseActivaId);
  } catch {
    mostrarError(
      "error-agregar-estudiante",
      "Error de conexión con el servidor.",
    );
  }
}

async function confirmarEliminarEstudiante(correoEstudiante) {
  if (!confirm(`¿Remover a ${correoEstudiante} de esta clase?`)) return;

  try {
    const res = await fetch(`${API}/inscripciones/remover`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
      body: JSON.stringify({
        email: correoEstudiante,
        id_clase: claseActivaId,
      }),
    });
    const data = await res.json();

    if (data.success) {
      mostrarToast("Estudiante removido.", "success");
      await cargarEstudiantesDeClase(claseActivaId);
    } else {
      mostrarToast(data.mensaje, "error");
    }
  } catch {
    mostrarToast("Error de conexión.", "error");
  }
}

async function confirmarEliminarClase() {
  if (!claseActivaId) return;
  if (
    !confirm(
      `¿Eliminar la clase "${claseActivaNombre}"? Se perderán todas las inscripciones.`,
    )
  )
    return;

  try {
    const res = await fetch(`${API}/clases/${claseActivaId}`, {
      method: "DELETE",
      credentials: "include",
      headers: getAuthHeaders(),
    });
    const data = await res.json();

    if (data.success) {
      mostrarToast("Clase eliminada.", "success");
      claseActivaId = null;
      await cargarClasesSidebar();
    } else {
      mostrarToast(data.mensaje, "error");
    }
  } catch {
    mostrarToast("Error de conexión.", "error");
  }
}

// ── Búsqueda Avanzada ────────────────────────────────────────────────────────
let _buscarTimeout = null;
async function buscarEstudiante(query) {
  clearTimeout(_buscarTimeout);
  if (query.trim().length < 3) return;

  _buscarTimeout = setTimeout(async () => {
    try {
      const res = await fetch(
        `${API}/estudiantes/buscar?q=${encodeURIComponent(query)}&correo_profesor=${encodeURIComponent(sesion.correo)}`,
        {
          credentials: "include",
          headers: getAuthHeaders(),
        },
      );
      const data = await res.json();
      const contenido = document.getElementById("resultado-busqueda");

      if (!data.success || !data.student) {
        contenido.innerHTML = `<p class="no-result">No se encontró ningún estudiante.</p>`;
      } else {
        const est = data.student;
        const clases = (est.clases || [])
          .map((c) => `<span class="result-clase-tag">Grupo ${c}</span>`)
          .join(" ");

        contenido.innerHTML = `
          <div class="result-estudiante" style="padding: 10px; border-left: 4px solid #3d8bfd; background: #f8f9fa; border-radius: 4px;">
            <strong style="font-size: 16px; color: #333;">${est.nombre}</strong><br/>
            <span style="color: #666; font-size: 14px;">${est.correo}</span>
            <div style="margin-top:10px;">
              <small style="color:#444; font-weight:600; display:block; margin-bottom:4px;">Asignado a:</small>
              <div style="display:flex; gap:6px; flex-wrap:wrap;">${clases || '<span style="color:#aaa; font-size:13px;">Sin clases asignadas</span>'}</div>
            </div>
          </div>
        `;
      }
      abrirModal("modal-buscar-estudiante");
    } catch {
      mostrarToast("Error al buscar el estudiante.", "error");
    }
  }, 600);
}

function filtrarEstudiantesTabla(texto) {
  const query = texto.toLowerCase().trim();
  const estudiantesFiltrados = listaEstudiantesOriginal.filter(
    (est) =>
      est.nombre.toLowerCase().includes(query) ||
      est.correo.toLowerCase().includes(query),
  );
  renderizarTabla(estudiantesFiltrados);
}

// ── Utilidades de Interfaz ───────────────────────────────────────────────────
function abrirModal(id) {
  document.getElementById(id).style.display = "flex";
}
function cerrarModal(id) {
  document.getElementById(id).style.display = "none";
}

document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.style.display = "none";
  });
});

function mostrarToast(msg, tipo = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${tipo}`;
  t.style.display = "block";
  setTimeout(() => {
    t.style.display = "none";
  }, 3000);
}

function mostrarError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = "block";
}
function ocultarError(id) {
  document.getElementById(id).style.display = "none";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    if (document.getElementById("modal-crear-clase").style.display === "flex")
      crearClase();
    if (
      document.getElementById("modal-agregar-estudiante").style.display ===
      "flex"
    )
      agregarEstudiante();
  }
  if (e.key === "Escape") {
    document
      .querySelectorAll(".modal-overlay")
      .forEach((m) => (m.style.display = "none"));
  }
});

// Función Segura de Cierre de Sesión Completo
async function cerrarSesion() {
  try {
    await fetch(`${API}/logout`, {
      method: "POST",
      credentials: "include",
      headers: getAuthHeaders(),
    });
    localStorage.removeItem("datosVisionales");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error al cerrar sesión", error);
  }
}
