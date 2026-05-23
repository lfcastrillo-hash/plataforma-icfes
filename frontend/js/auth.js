// ==========================================================================
// 1. CONTROL DE INTERFAZ DIRECTA EN EL HERO
// ==========================================================================

function alternarHeroForm(tipo) {
    const loginForm = document.getElementById("hero-login-form");
    const registroForm = document.getElementById("hero-registro-form");
    limpiarMensajes();

    if (tipo === 'login') {
        loginForm.style.display = "block";
        registroForm.style.display = "none";
    } else if (tipo === 'registro') {
        loginForm.style.display = "none";
        registroForm.style.display = "block";
    }
}

function mostrarFeedback(contenedorId, texto, esExito = false) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    let msgElement = contenedor.querySelector(".auth-msg");
    
    if (!msgElement) {
        msgElement = document.createElement("p");
        msgElement.className = "auth-msg";
        msgElement.style.fontSize = "14px";
        msgElement.style.marginTop = "12px";
        msgElement.style.textAlign = "center";
        msgElement.style.fontWeight = "bold";
        contenedor.appendChild(msgElement);
    }
    
    msgElement.textContent = texto;
    msgElement.style.color = esExito ? "#2e7d32" : "#c62828"; 
}

function limpiarMensajes() {
    document.querySelectorAll(".auth-msg").forEach(el => el.remove());
}

// ==========================================================================
// 2. LOGICA DE PETICIONES (FETCH API) - JWT UPDATE
// ==========================================================================

// --- REGISTRO DE USUARIOS ---
async function registrarUsuario() {
  limpiarMensajes();

  const nombre = document.getElementById("reg-nombre").value.trim();
  const correo = document.getElementById("reg-correo").value.trim();
  const password = document.getElementById("reg-password").value.trim();
  
  const selectRol = document.querySelector("#hero-registro-form select");
  const rol = selectRol ? selectRol.value : "estudiante";

  if (!nombre || !correo || !password) {
    mostrarFeedback("hero-registro-form", "Todos los campos son obligatorios");
    return;
  }

  try {
    const respuesta = await fetch("http://localhost:3000/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, correo, password, rol }),
    });

    const data = await respuesta.json();

    if (!data.success) {
      mostrarFeedback("hero-registro-form", data.mensaje);
      return;
    }

    mostrarFeedback("hero-registro-form", "¡Registro exitoso! Ya puedes ingresar.", true);
    
    document.getElementById("reg-nombre").value = "";
    document.getElementById("reg-correo").value = "";
    document.getElementById("reg-password").value = "";
    if (selectRol) selectRol.value = "estudiante";
    
    setTimeout(() => alternarHeroForm('login'), 1500);

  } catch (error) {
    console.error("Error en registro:", error);
    mostrarFeedback("hero-registro-form", "Error de conexión con el servidor");
  }
}

// --- INICIO DE SESIÓN CON JWT Y COOKIES ---
async function iniciarSesion() {
  limpiarMensajes();

  const correo   = document.getElementById("correo").value.trim();
  const password = document.getElementById("password").value.trim();
  const rol      = document.getElementById("rol").value;

  if (!correo || !password) {
    mostrarFeedback("hero-login-form", "Completa todos los campos");
    return;
  }

  mostrarWaterLoader();

  try {
    const respuesta = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // IMPORTANTE: 'include' asegura que el navegador acepte y guarde la cookie HttpOnly
      // que envía el servidor en la respuesta.
      credentials: 'include', 
      body: JSON.stringify({ correo, password, rol }),
    });

    const data = await respuesta.json();

    if (!data.success) {
      waterLoaderError(data.mensaje);
      return;
    }

    // ELIMINADO: localStorage.setItem("usuarioActivo", ...)
    // Ya no lo necesitamos, el backend nos dio una cookie segura (token_acceso)
    
    // Podemos guardar el nombre o el correo solo para mostrarlo visualmente, 
    // pero NUNCA usamos esto para dar permisos. Los permisos van en la cookie.
    localStorage.setItem("datosVisionales", JSON.stringify({
      correo: data.usuario.correo, 
      nombre: data.usuario.nombre 
    }));

    // === AQUÍ SE ACTUALIZARON LAS RUTAS AL NUEVO NOMBRE ===
    const destino = rol === "estudiante"
      ? "panel-estudiante.html"
      : "panel-profesor.html";

    waterLoaderExito(destino);

  } catch (error) {
    console.error("Error en login:", error);
    waterLoaderError("Error de conexión con el servidor");
  }
}