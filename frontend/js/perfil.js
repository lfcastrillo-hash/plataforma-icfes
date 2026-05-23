const URL_BASE = "http://localhost:3000/api";
const SERVER_URL = "http://localhost:3000";

// Obtenemos el ID del profesor desde el localStorage (ej: de tu pantalla de login)
// Si estás probando y no tienes login aún, cambia el '1' por un ID que exista en tu BD
const idUsuario = localStorage.getItem("id_usuario") || 1; 

// ==========================================
// 1. CARGAR DATOS CUANDO SE ABRE LA PÁGINA
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch(`${URL_BASE}/perfil/${idUsuario}`);
    
    if (response.ok) {
      const usuario = await response.json();
      
      // Llenar campos de texto
      document.getElementById("perfil-nombre").textContent = usuario.nombre;
      document.getElementById("update-nombre").value = usuario.nombre;
      
      // Si ya tiene una foto en la BD, la renderizamos
      if (usuario.foto_perfil) {
        document.getElementById("foto-preview").innerHTML = 
          `<img src="${SERVER_URL}${usuario.foto_perfil}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
      }
    } else {
      console.error("No se pudo cargar la información del perfil");
    }
  } catch (error) {
    console.error("Error de conexión al cargar perfil:", error);
  }
});

// ==========================================
// 2. VISTA PREVIA DE LA FOTO SELECCIONADA
// ==========================================
document.getElementById('input-foto').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('foto-preview').innerHTML = 
        `<img src="${e.target.result}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    }
    reader.readAsDataURL(file);
  }
});

// ==========================================
// 3. ENVIAR FORMULARIO DE ACTUALIZACIÓN
// ==========================================
document.getElementById('form-perfil').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('update-nombre').value;
  const fotoInput = document.getElementById('input-foto');
  
  if (!nombre.trim()) {
    alert("El nombre no puede estar vacío");
    return;
  }

  // Preparamos el FormData
  const formData = new FormData();
  formData.append('nombre', nombre);
  formData.append('id_usuario', idUsuario); // Enviamos el ID al backend
  
  if (fotoInput.files[0]) {
    formData.append('foto', fotoInput.files[0]); 
  }

  try {
    const response = await fetch(`${URL_BASE}/perfil/actualizar`, {
      method: 'POST',
      body: formData 
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.mensaje);
      
      // Actualizamos el nombre en la tarjeta principal
      document.getElementById("perfil-nombre").textContent = data.nombre;
      
      // Si cambió la foto, nos aseguramos de fijar la URL final que nos dio el servidor
      if (data.foto) {
        document.getElementById('foto-preview').innerHTML = 
          `<img src="${SERVER_URL}${data.foto}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
      }
    } else {
      alert(data.mensaje || "Hubo un error al guardar los cambios.");
    }
  } catch (error) {
    console.error('Error en la petición de actualización:', error);
    alert("Error al conectar con el servidor.");
  }
});