const API = "http://localhost:3000/api";
const SERVER_URL = "http://localhost:3000";

let sesion = JSON.parse(localStorage.getItem("datosVisionales") || "{}");

if (!sesion.correo) {
  window.location.href = "index.html";
}

// Guardamos los datos actuales para no sobreescribirlos accidentalmente al enviar formularios separados
let datosActuales = { nombre: "", correo: "", biografia: "" };

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch(`${API}/perfil/${encodeURIComponent(sesion.correo)}`, {
        credentials: 'include'
    });
    
    if (response.ok) {
      const usuario = await response.json();
      
      // Respaldar datos
      datosActuales.nombre = usuario.nombre;
      datosActuales.correo = usuario.email;
      datosActuales.biografia = usuario.biografia || "";

      // 1. Llenar textos principales
      document.getElementById("perfil-nombre").textContent = usuario.nombre;
      if (usuario.biografia) {
          document.getElementById("perfil-biografia").textContent = usuario.biografia;
      }

      // 2. Llenar los campos de los modales
      document.getElementById("update-nombre").value = usuario.nombre;
      document.getElementById("update-biografia").value = usuario.biografia || "";
      document.getElementById("update-correo").value = usuario.email; 
      
      // 3. Renderizar la lista de clases tipo Moodle
      const contenedorClases = document.getElementById("lista-clases-perfil");
      contenedorClases.innerHTML = ""; 
      
      if (usuario.lista_clases && usuario.lista_clases.length > 0) {
          usuario.lista_clases.forEach(clase => {
              const a = document.createElement("a");
              a.href = "panel-profesor.html"; // === ACTUALIZADO ===
              a.textContent = `MÓDULO: GRUPO ${clase.toUpperCase()}`;
              a.style.color = "#0284c7";
              a.style.textDecoration = "none";
              a.style.fontSize = "14px";
              a.onmouseover = () => a.style.textDecoration = "underline";
              a.onmouseout = () => a.style.textDecoration = "none";
              contenedorClases.appendChild(a);
          });
      } else {
          contenedorClases.innerHTML = "<p style='color: #888; font-size: 14px;'>No tienes clases asignadas aún.</p>";
      }
      
      // 4. Cargar Foto
      if (usuario.foto_perfil) {
        document.getElementById("foto-preview-main").innerHTML = 
          `<img src="${SERVER_URL}${usuario.foto_perfil}" style="width: 100%; height: 100%; object-fit: cover;">`;
      } else {
        document.getElementById("nav-avatar-text").textContent = usuario.nombre.charAt(0).toUpperCase();
      }
    }
  } catch (error) {
    console.error("Error cargando perfil:", error);
  }
});

// ==========================================
// CONTROL DE MODALES
// ==========================================
function abrirModalEditar() { document.getElementById("modal-editar-perfil").style.display = "flex"; }
function cerrarModalEditar() { document.getElementById("modal-editar-perfil").style.display = "none"; }

function abrirModalSeguridad() { document.getElementById("modal-seguridad").style.display = "flex"; }
function cerrarModalSeguridad() { document.getElementById("modal-seguridad").style.display = "none"; }

document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
        if(e.target === overlay) {
            cerrarModalEditar();
            cerrarModalSeguridad();
        }
    });
});

document.getElementById('input-foto').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
      document.getElementById('mini-preview').textContent = "Seleccionaste: " + file.name;
      document.getElementById('mini-preview').style.color = "#0ea5e9";
  }
});

// ==========================================
// FORMULARIO 1: EDITAR PERFIL (PÚBLICO)
// ==========================================
document.getElementById('form-perfil').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('update-nombre').value;
  const biografia = document.getElementById('update-biografia').value;
  const fotoInput = document.getElementById('input-foto');
  
  if (!nombre.trim()) return alert("El nombre es obligatorio");

  const formData = new FormData();
  formData.append('nombre', nombre);
  formData.append('biografia', biografia);
  formData.append('nuevo_correo', datosActuales.correo); // Mantenemos el correo intacto
  
  if (fotoInput.files[0]) {
    formData.append('foto', fotoInput.files[0]); 
  }

  enviarActualizacion(formData);
});

// ==========================================
// FORMULARIO 2: SEGURIDAD (CORREO Y CLAVE)
// ==========================================
document.getElementById('form-seguridad').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nuevoCorreo = document.getElementById('update-correo').value;
  const password = document.getElementById('update-password').value;
  
  if (!nuevoCorreo.trim()) return alert("El correo es obligatorio");

  const formData = new FormData();
  formData.append('nuevo_correo', nuevoCorreo);
  formData.append('nombre', datosActuales.nombre);       // Mantenemos nombre intacto
  formData.append('biografia', datosActuales.biografia); // Mantenemos bio intacta
  
  // Enviamos la clave al backend (requiere actualización en el backend para procesarla)
  if (password.trim() !== "") {
    formData.append('password', password); 
  }

  enviarActualizacion(formData);
});

// ==========================================
// FUNCIÓN COMÚN DE ENVÍO
// ==========================================
async function enviarActualizacion(formData) {
  try {
    const response = await fetch(`${API}/perfil/actualizar`, {
      method: 'POST',
      credentials: 'include', 
      body: formData 
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
    console.error('Error al actualizar:', error);
  }
}