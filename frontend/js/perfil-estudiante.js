// ==========================================================================
// LÓGICA DEL PERFIL DEL ESTUDIANTE
// ==========================================================================

// --- Menú Lateral ---
function toggleMenu() {
  const menu = document.getElementById('sidebar-menu');
  const btn = document.getElementById('btn-menu');
  menu.classList.toggle('abierto');
  btn.classList.toggle('active');
}

// --- Control de Modales ---
function abrirModalEditar() { 
    document.getElementById('modal-editar-perfil').style.display = 'flex'; 
}
function cerrarModalEditar() { 
    document.getElementById('modal-editar-perfil').style.display = 'none'; 
}
function abrirModalSeguridad() { 
    document.getElementById('modal-seguridad').style.display = 'flex'; 
}
function cerrarModalSeguridad() { 
    document.getElementById('modal-seguridad').style.display = 'none'; 
}

// --- Funciones de guardado (Para conectar a Supabase después) ---
function guardarPerfil() {
  alert("¡Perfil guardado! (Falta conectar al backend)");
  cerrarModalEditar();
}

function guardarSeguridad() {
  alert("¡Credenciales actualizadas! (Falta conectar al backend)");
  cerrarModalSeguridad();
}

// --- Cerrar Sesión ---
async function cerrarSesion() {
  try {
    await fetch(`http://localhost:3000/api/logout`, { method: 'POST', credentials: 'include' });
    localStorage.removeItem('datosVisionales');
    localStorage.removeItem('usuarioActivo');
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error al cerrar sesión", error);
  }
}

// --- Carga de Datos Inicial ---
document.addEventListener("DOMContentLoaded", () => {
  const sesion = JSON.parse(localStorage.getItem("datosVisionales") || localStorage.getItem("usuarioActivo") || "{}");
  
  if (!sesion.correo) {
    window.location.href = "index.html";
    return;
  }
  
  const inicial = (sesion.nombre || sesion.correo).charAt(0).toUpperCase();
  const nombreMostrar = sesion.nombre || sesion.correo;

  // Llenamos datos en la tarjeta central
  document.getElementById("estudiante-nombre").textContent = nombreMostrar;
  document.getElementById("estudiante-avatar-grande").textContent = inicial;
  
  // Llenamos el modal de edición para que ya tenga los datos al abrirlo
  document.getElementById("update-nombre").value = nombreMostrar; 
  document.getElementById("update-correo").value = sesion.correo; 
  
  // Llenamos la navbar
  document.getElementById("nav-nombre-estudiante").textContent = sesion.correo;
  document.getElementById("nav-avatar").textContent = inicial;
});