/* ==========================================================================
   panel-estudiante.js
   Lógica del panel del estudiante
   ========================================================================== */

const API = "http://localhost:3000/api";

// ─────────────────────────────────────────────────────────────
// Verificar sesión
// ─────────────────────────────────────────────────────────────
const sesion = JSON.parse(
  localStorage.getItem("datosVisionales") ||
    localStorage.getItem("usuarioActivo") ||
    "{}",
);

if (!sesion.correo) {
  window.location.href = "index.html";
}

// Helper: enviar token en headers
function getAuthHeaders(extra = {}) {
  const token = sesion.token || "";
  const base = token ? { Authorization: `Bearer ${token}` } : {};
  return { ...base, ...extra };
}

// ─────────────────────────────────────────────────────────────
// Cargar datos
// ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const correo = sesion.correo || "";
  const SERVER_URL = "http://localhost:3000";

  // Mostrar correo en navbar
  const navNombre = document.getElementById("nav-nombre-estudiante");

  if (navNombre) {
    navNombre.textContent = correo;
  }

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

      const nombreMostrar = usuario.nombre
        ? usuario.nombre.split(" ")[0]
        : "Estudiante";

      // Saludo
      const saludo = document.getElementById("saludo-estudiante");

      if (saludo) {
        saludo.textContent = `¡Hola, ${nombreMostrar}!`;
      }

      // Progreso real desde progreso_areas
      try {
        const resProg = await fetch(
          `${API}/progreso-general/${encodeURIComponent(correo)}`,
          { credentials: "include", headers: getAuthHeaders() },
        );
        const dataProg = await resProg.json();
        const progreso = Math.round(dataProg.progreso || 0);

        const barra = document.getElementById("barra-progreso-general");
        if (barra) barra.style.width = `${progreso}%`;

        const textoProgreso = document.getElementById("texto-progreso-general");
        if (textoProgreso) textoProgreso.textContent = `${progreso}%`;
      } catch (e) {
        console.warn("No se pudo cargar el progreso general:", e);
      }

      // Avatar
      const avatar = document.getElementById("nav-avatar");

      if (avatar) {
        if (usuario.foto_perfil) {
          avatar.innerHTML = `
            <img
              src="${SERVER_URL}${usuario.foto_perfil}"
              style="
                width:100%;
                height:100%;
                border-radius:50%;
                object-fit:cover;
                display:block;
              "
            >
          `;
        } else {
          avatar.textContent = (usuario.nombre || correo)
            .charAt(0)
            .toUpperCase();
        }
      }
    } else {
      console.warn("No se pudo cargar el perfil:", response.status);

      const saludo = document.getElementById("saludo-estudiante");

      if (saludo) {
        saludo.textContent = "¡Hola!";
      }

      const avatar = document.getElementById("nav-avatar");

      if (avatar) {
        avatar.textContent = correo.charAt(0).toUpperCase();
      }
    }
  } catch (error) {
    console.error("Error al cargar perfil:", error);

    const saludo = document.getElementById("saludo-estudiante");

    if (saludo) {
      saludo.textContent = "¡Hola!";
    }
  }

  cargarAnunciosEstudiante();
});

// ─────────────────────────────────────────────────────────────
// Cargar anuncios
// ─────────────────────────────────────────────────────────────
async function cargarAnunciosEstudiante() {
  try {
    const res = await fetch(
      `${API}/estudiante/anuncios?correo=${encodeURIComponent(sesion.correo)}`,
      {
        credentials: "include",
        headers: getAuthHeaders(),
      },
    );

    const data = await res.json();

    const contenedor = document.getElementById("contenedor-anuncios");

    if (!contenedor) return;

    if (data.success && data.anuncios && data.anuncios.length > 0) {
      contenedor.innerHTML = "";
      contenedor.style.display = "block";

      data.anuncios.forEach((clase) => {
        if (clase.anuncio && clase.anuncio.trim() !== "") {
          contenedor.innerHTML += `
            <div
              style="
                background-color:#fffbeb;
                border-left:5px solid #f59e0b;
                padding:20px;
                border-radius:8px;
                margin-bottom:25px;
                box-shadow:0 2px 5px rgba(0,0,0,0.05);
              "
            >
              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  align-items:center;
                  margin-bottom:8px;
                "
              >
                <h4
                  style="
                    color:#b45309;
                    margin:0;
                    font-size:15px;
                  "
                >
                  📌 Anuncio de ${clase.nombre_clase}
                </h4>
              </div>

              <p
                style="
                  color:#555;
                  margin:0;
                  font-size:15px;
                  line-height:1.5;
                  white-space:pre-wrap;
                "
              >
                ${clase.anuncio}
              </p>
            </div>
          `;
        }
      });
    }
  } catch (error) {
    console.error("Error cargando anuncios:", error);
  }
}

// ─────────────────────────────────────────────────────────────
// Cerrar sesión
// ─────────────────────────────────────────────────────────────
async function cerrarSesion() {
  try {
    await fetch(`${API}/logout`, {
      method: "POST",
      credentials: "include",
      headers: getAuthHeaders(),
    });

    localStorage.removeItem("datosVisionales");
    localStorage.removeItem("usuarioActivo");

    window.location.href = "index.html";
  } catch (error) {
    console.error("Error al cerrar sesión", error);
  }
}

// ─────────────────────────────────────────────────────────────
// Menú hamburguesa
// ─────────────────────────────────────────────────────────────
function toggleMenu() {
  const menu = document.getElementById("sidebar-menu");

  const btn = document.getElementById("btn-menu");

  if (menu) {
    menu.classList.toggle("abierto");
  }

  if (btn) {
    btn.classList.toggle("active");
  }
}
