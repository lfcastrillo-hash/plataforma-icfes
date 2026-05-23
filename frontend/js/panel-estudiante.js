/* ==========================================================================
   panel-estudiante.js
   Lógica del panel del estudiante: cargar perfil, progreso general, 
   y mostrar anuncios de sus clases (desde Supabase).
   ========================================================================== */
const API = "http://localhost:3000/api";

// ── 1. Verificar Sesión (Actualizado para evitar bloqueos) ───────────────────
// Busca en datosVisionales, y si no está, busca en el viejo usuarioActivo por compatibilidad
const sesion = JSON.parse(localStorage.getItem("datosVisionales") || localStorage.getItem("usuarioActivo") || "{}");

// Validamos solo el correo principal para no expulsarlo injustamente
if (!sesion.correo) {
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  const correo = sesion.correo || "";
  const SERVER_URL = "http://localhost:3000";

  // Mostrar el correo en la barra superior
  document.getElementById("nav-nombre-estudiante").textContent = correo;

  // ── 2. Cargar Datos del Perfil (Nombre, Foto, Progreso) ──────────────────
  try {
    const response = await fetch(`${API}/perfil/${encodeURIComponent(correo)}`, {
        credentials: 'include'
    });

    if (response.ok) {
      const usuario = await response.json();
      
      // Saludo
      const nombreMostrar = usuario.nombre ? usuario.nombre.split(' ')[0] : 'Estudiante';
      document.getElementById("saludo-estudiante").textContent = `¡Hola, ${nombreMostrar}!`;

      // Progreso (asumiendo que viene en el perfil, o lo calculamos)
      const progreso = usuario.puntaje || 0;
      document.getElementById("barra-progreso-general").style.width = `${progreso}%`;
      document.getElementById("texto-progreso-general").textContent = `${progreso}%`;

      // Avatar
      if (usuario.foto_perfil) {
        document.getElementById("nav-avatar").innerHTML = 
          `<img src="${SERVER_URL}${usuario.foto_perfil}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block;">`;
      } else {
        document.getElementById("nav-avatar").textContent = (usuario.nombre || correo).charAt(0).toUpperCase();
      }
    } else {
      document.getElementById("saludo-estudiante").textContent = `¡Hola!`;
      document.getElementById("nav-avatar").textContent = correo.charAt(0).toUpperCase();
    }
  } catch (error) {
    console.error("Error al cargar perfil:", error);
    document.getElementById("saludo-estudiante").textContent = `¡Hola!`;
  }

  // ── 3. Cargar Anuncios de las clases del estudiante ──────────────────────
  cargarAnunciosEstudiante();
});

async function cargarAnunciosEstudiante() {
    try {
        const res = await fetch(`${API}/estudiante/anuncios?correo=${encodeURIComponent(sesion.correo)}`, {
            credentials: 'include'
        });
        const data = await res.json();

        if (data.success && data.anuncios && data.anuncios.length > 0) {
            const contenedor = document.getElementById("contenedor-anuncios");
            contenedor.innerHTML = ""; // Limpiar
            contenedor.style.display = "block"; // Mostrar contenedor

            data.anuncios.forEach(clase => {
                if(clase.anuncio && clase.anuncio.trim() !== "") {
                    const htmlAnuncio = `
                        <div style="background-color: #fffbeb; border-left: 5px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <h4 style="color: #b45309; margin: 0; font-size: 15px;">📌 Anuncio de ${clase.nombre_clase}</h4>
                            </div>
                            <p style="color: #555; margin: 0; font-size: 15px; line-height: 1.5; white-space: pre-wrap;">${clase.anuncio}</p>
                        </div>
                    `;
                    contenedor.innerHTML += htmlAnuncio;
                }
            });
        }
    } catch (error) {
        console.error("Error cargando anuncios:", error);
    }
}

// ── 4. Cerrar Sesión ─────────────────────────────────────────────────────────
async function cerrarSesion() {
    try {
        await fetch(`${API}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        localStorage.removeItem('datosVisionales');
        localStorage.removeItem('usuarioActivo'); // Limpiamos también el viejo por si acaso
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error al cerrar sesión", error);
    }
}

// ── 5. Interfaz: Menú Desplegable (Hamburguesa) ──────────────────────────────
function toggleMenu() {
  const menu = document.getElementById('sidebar-menu');
  const btn = document.getElementById('btn-menu');
  
  menu.classList.toggle('abierto');
  btn.classList.toggle('active');
}