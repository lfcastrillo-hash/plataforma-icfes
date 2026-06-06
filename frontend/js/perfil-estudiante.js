// ==========================================================================
// LÓGICA DEL PERFIL DEL ESTUDIANTE
// ==========================================================================

const API = "http://localhost:3000/api";
const SERVER_URL = "http://localhost:3000";

let sesion = JSON.parse(
  localStorage.getItem("datosVisionales") ||
    localStorage.getItem("usuarioActivo") ||
    "{}",
);
let datosActuales = { nombre: "", correo: "", biografia: "" };

// --- Menú Lateral ---
function toggleMenu() {
  const menu = document.getElementById("sidebar-menu");
  const btn = document.getElementById("btn-menu");
  menu.classList.toggle("abierto");
  btn.classList.toggle("active");
}

// --- Control de Modales ---
function abrirModalEditar() {
  document.getElementById("update-nombre").value = datosActuales.nombre;
  document.getElementById("update-biografia").value = datosActuales.biografia;
  document.getElementById("modal-editar-perfil").style.display = "flex";
}
function cerrarModalEditar() {
  document.getElementById("modal-editar-perfil").style.display = "none";
}
function abrirModalSeguridad() {
  document.getElementById("update-correo").value = datosActuales.correo;
  document.getElementById("update-password").value = "";
  document.getElementById("modal-seguridad").style.display = "flex";
}
function cerrarModalSeguridad() {
  document.getElementById("modal-seguridad").style.display = "none";
}

// --- Cerrar modal al hacer click fuera ---
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        cerrarModalEditar();
        cerrarModalSeguridad();
      }
    });
  });
});

// --- Preview de foto seleccionada ---
document.addEventListener("DOMContentLoaded", () => {
  const inputFoto = document.getElementById("input-foto");
  if (inputFoto) {
    inputFoto.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          document.getElementById("foto-preview-main").innerHTML =
            `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        };
        reader.readAsDataURL(file);
      }
    });
  }
});

// --- Carga de Datos Inicial desde el Backend ---
document.addEventListener("DOMContentLoaded", async () => {
  if (!sesion.correo) {
    window.location.href = "index.html";
    return;
  }

  const inicialTemp = (sesion.nombre || sesion.correo).charAt(0).toUpperCase();
  document.getElementById("nav-nombre-estudiante").textContent = sesion.correo;
  document.getElementById("nav-avatar").textContent = inicialTemp;

  try {
    const response = await fetch(
      `${API}/perfil/${encodeURIComponent(sesion.correo)}`,
      {
        credentials: "include",
      },
    );

    if (response.ok) {
      const usuario = await response.json();

      datosActuales.nombre = usuario.nombre || sesion.nombre || "";
      datosActuales.correo = usuario.email || sesion.correo;
      datosActuales.biografia = usuario.biografia || "";

      document.getElementById("estudiante-nombre").textContent =
        datosActuales.nombre;

      if (usuario.foto_perfil) {
        document.getElementById("foto-preview-main").innerHTML =
          `<img src="${SERVER_URL}${usuario.foto_perfil}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        document.getElementById("nav-avatar").innerHTML =
          `<img src="${SERVER_URL}${usuario.foto_perfil}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;">`;
      } else {
        const inicial = datosActuales.nombre.charAt(0).toUpperCase();
        document.getElementById("estudiante-avatar-grande").textContent =
          inicial;
        document.getElementById("nav-avatar").textContent = inicial;
      }

      sesion.nombre = datosActuales.nombre;
      sesion.correo = datosActuales.correo;
      localStorage.setItem("datosVisionales", JSON.stringify(sesion));
    } else {
      const nombre = sesion.nombre || sesion.correo;
      document.getElementById("estudiante-nombre").textContent = nombre;
      document.getElementById("estudiante-avatar-grande").textContent = nombre
        .charAt(0)
        .toUpperCase();
      datosActuales.nombre = nombre;
      datosActuales.correo = sesion.correo;
    }
  } catch (error) {
    console.error("Error cargando perfil:", error);
    const nombre = sesion.nombre || sesion.correo;
    document.getElementById("estudiante-nombre").textContent = nombre;
    document.getElementById("estudiante-avatar-grande").textContent = nombre
      .charAt(0)
      .toUpperCase();
    datosActuales.nombre = nombre;
    datosActuales.correo = sesion.correo;
  }
});

// --- Guardar Perfil (nombre, bio, foto) ---
async function guardarPerfil() {
  const nombre = document.getElementById("update-nombre").value.trim();
  const biografia = document.getElementById("update-biografia").value;
  const fotoInput = document.getElementById("input-foto");

  if (!nombre) return alert("El nombre es obligatorio.");

  const formData = new FormData();
  formData.append("nombre", nombre);
  formData.append("biografia", biografia);
  formData.append("nuevo_correo", datosActuales.correo);
  if (fotoInput && fotoInput.files[0])
    formData.append("foto", fotoInput.files[0]);

  await enviarActualizacion(formData);
  cerrarModalEditar();
}

// --- Guardar Seguridad (correo y contraseña) ---
async function guardarSeguridad() {
  const nuevoCorreo = document.getElementById("update-correo").value.trim();
  const password = document.getElementById("update-password").value;

  if (!nuevoCorreo) return alert("El correo es obligatorio.");

  const formData = new FormData();
  formData.append("nuevo_correo", nuevoCorreo);
  formData.append("nombre", datosActuales.nombre);
  formData.append("biografia", datosActuales.biografia);
  if (password.trim() !== "") formData.append("password", password);

  await enviarActualizacion(formData);
  cerrarModalSeguridad();
}

// --- Función común de envío al backend ---
async function enviarActualizacion(formData) {
  try {
    const response = await fetch(`${API}/perfil/actualizar`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      alert("¡Datos guardados correctamente!");
      sesion.correo = data.correo;
      sesion.nombre = data.nombre;
      localStorage.setItem("datosVisionales", JSON.stringify(sesion));
      window.location.reload();
    } else {
      alert(data.mensaje || "Error al guardar los datos.");
    }
  } catch (error) {
    console.error("Error al actualizar:", error);
    alert("Error de conexión con el servidor.");
  }
}

// --- Cerrar Sesión ---
async function cerrarSesion() {
  try {
    await fetch(`${API}/logout`, { method: "POST", credentials: "include" });
    localStorage.removeItem("datosVisionales");
    localStorage.removeItem("usuarioActivo");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error al cerrar sesión", error);
  }
}
