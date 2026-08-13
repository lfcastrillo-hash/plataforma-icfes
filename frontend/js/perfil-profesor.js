const API = "/api";
const SERVER_URL = "";

let sesion = JSON.parse(localStorage.getItem("datosVisionales") || "{}");

if (!sesion.correo) {
  window.location.href = "index.html";
}

// Helper: headers con token
function getAuthHeaders(extraHeaders = {}) {
  const token = sesion.token || "";
  const base = token ? { Authorization: `Bearer ${token}` } : {};
  return { ...base, ...extraHeaders };
}

let datosActuales = { nombre: "", correo: "", biografia: "" };

document.addEventListener("DOMContentLoaded", async () => {
  // --- Carga de Datos Inicial desde el Backend ---
  try {
    const response = await fetch(
      `${API}/perfil/${encodeURIComponent(sesion.correo)}`,
      {
        credentials: "include",
        headers: getAuthHeaders(),
      },
    );

    if (response.ok) {
      const usuario = await response.json();

      datosActuales.nombre = usuario.nombre;
      datosActuales.correo = usuario.email;
      datosActuales.biografia = usuario.biografia || "";

      document.getElementById("perfil-nombre").textContent = usuario.nombre;
      const bioPerfil = document.getElementById("perfil-biografia");
      if (bioPerfil) {
        bioPerfil.innerHTML = datosActuales.biografia
          ? `<i>${datosActuales.biografia}</i>`
          : `<i>Apasionado por la educación y comprometido con el éxito de mis estudiantes en el ICFES.</i>`;
      }

      document.getElementById("update-nombre").value = usuario.nombre;
      document.getElementById("update-biografia").value =
        usuario.biografia || "";
      document.getElementById("update-correo").value = usuario.email;

      const contenedorClases = document.getElementById("lista-clases-perfil");
      contenedorClases.innerHTML = "";

      if (usuario.lista_clases && usuario.lista_clases.length > 0) {
        usuario.lista_clases.forEach((clase) => {
          const a = document.createElement("a");
          a.href = "panel-profesor.html";
          a.textContent = `MÓDULO: GRUPO ${clase.toUpperCase()}`;
          a.style.color = "#0284c7";
          a.style.textDecoration = "none";
          a.style.fontSize = "14px";
          a.onmouseover = () => (a.style.textDecoration = "underline");
          a.onmouseout = () => (a.style.textDecoration = "none");
          contenedorClases.appendChild(a);
        });
      } else {
        contenedorClases.innerHTML =
          "<p style='color: #888; font-size: 14px;'>No tienes clases asignadas aún.</p>";
      }

      if (usuario.foto_perfil) {
        document.getElementById("foto-preview-main").innerHTML =
          `<img src="${SERVER_URL}${usuario.foto_perfil}" style="width: 100%; height: 100%; object-fit: cover;">`;
      } else {
        document.getElementById("nav-avatar-text").textContent = usuario.nombre
          .charAt(0)
          .toUpperCase();
      }
    } else {
      console.error("Error al obtener perfil, código:", response.status);
    }
  } catch (error) {
    console.error("Error cargando perfil:", error);
  }

  // --- Cerrar modales al hacer click fuera ---
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        cerrarModalEditar();
        cerrarModalSeguridad();
      }
    });
  });

  // --- Preview de foto seleccionada ---
  const inputFoto = document.getElementById("input-foto");
  if (inputFoto) {
    inputFoto.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file) {
        document.getElementById("mini-preview").textContent =
          "Seleccionaste: " + file.name;
        document.getElementById("mini-preview").style.color = "#0ea5e9";
      }
    });
  }

  // --- Formulario 1: Editar Perfil (público) ---
  const formPerfil = document.getElementById("form-perfil");
  if (formPerfil) {
    formPerfil.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombre = document.getElementById("update-nombre").value;
      const biografia = document.getElementById("update-biografia").value;
      const fotoInput = document.getElementById("input-foto");

      if (!nombre.trim()) return alert("El nombre es obligatorio");

      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("biografia", biografia);
      formData.append("nuevo_correo", datosActuales.correo);

      if (fotoInput && fotoInput.files[0]) {
        formData.append("foto", fotoInput.files[0]);
      }

      enviarActualizacion(formData);
    });
  }

  // --- Formulario 2: Seguridad (correo y clave) ---
  const formSeguridad = document.getElementById("form-seguridad");
  if (formSeguridad) {
    formSeguridad.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nuevoCorreo = document.getElementById("update-correo").value;
      const password = document.getElementById("update-password").value;

      if (!nuevoCorreo.trim()) return alert("El correo es obligatorio");

      const formData = new FormData();
      formData.append("nuevo_correo", nuevoCorreo);
      formData.append("nombre", datosActuales.nombre);
      formData.append("biografia", datosActuales.biografia);

      if (password.trim() !== "") {
        formData.append("password", password);
      }

      enviarActualizacion(formData);
    });
  }
});

// ==========================================
// CONTROL DE MODALES
// ==========================================
function abrirModalEditar() {
  document.getElementById("modal-editar-perfil").style.display = "flex";
}
function cerrarModalEditar() {
  document.getElementById("modal-editar-perfil").style.display = "none";
}

function abrirModalSeguridad() {
  document.getElementById("modal-seguridad").style.display = "flex";
}
function cerrarModalSeguridad() {
  document.getElementById("modal-seguridad").style.display = "none";
}

// ==========================================
// FUNCIÓN COMÚN DE ENVÍO
// ==========================================
async function enviarActualizacion(formData) {
  try {
    const response = await fetch(`${API}/perfil/actualizar`, {
      method: "POST",
      credentials: "include",
      headers: getAuthHeaders(), // Sin Content-Type porque FormData lo pone solo
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      alert("Datos guardados correctamente.");

      sesion.correo = data.correo;
      sesion.nombre = data.nombre;
      localStorage.setItem("datosVisionales", JSON.stringify(sesion));

      window.location.reload();
    } else {
      alert(data.mensaje);
    }
  } catch (error) {
    console.error("Error al actualizar:", error);
    alert("Error de conexión con el servidor.");
  }
}
