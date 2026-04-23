function obtenerUsuario() {
  return JSON.parse(localStorage.getItem("usuarioActivo"));
}

function obtenerClaveProgreso() {
  const usuario = obtenerUsuario();
  return "progresoMatematicas_" + usuario.correo;
}

function obtenerProgreso() {
  return JSON.parse(localStorage.getItem(obtenerClaveProgreso())) || 0;
}

function guardarProgreso(valor) {
  localStorage.setItem(obtenerClaveProgreso(), JSON.stringify(valor));
}

function actualizarBarra() {
  const barra = document.querySelector(".progress");
  if (barra) {
    const progreso = obtenerProgreso();
    barra.style.width = progreso + "%";
    barra.textContent = progreso + "%";
  }
}

function marcarTema(boton, valor = 30) {
  let progreso = obtenerProgreso();

  if (!boton.classList.contains("completado")) {
    progreso += valor;
    if (progreso > 100) progreso = 100;

    boton.textContent = "Completado";
    boton.style.background = "green";
    boton.classList.add("completado");

    guardarProgreso(progreso);
    actualizarBarra();
  }
}

function responderReto(correcta) {
  const mensaje = document.getElementById("mensajeReto");

  if (correcta) {
    mensaje.textContent = "Correcto ✅";
    mensaje.style.color = "green";
  } else {
    mensaje.textContent = "Intenta de nuevo ❌";
    mensaje.style.color = "red";
  }
}

window.onload = actualizarBarra;
