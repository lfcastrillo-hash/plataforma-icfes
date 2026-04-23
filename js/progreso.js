let progreso = JSON.parse(localStorage.getItem("progresoMatematicas")) || 0;

function actualizarBarra() {
  const barra = document.querySelector(".progress");
  if (barra) {
    barra.style.width = progreso + "%";
    barra.textContent = progreso + "%";
  }
}

function marcarTema(boton, valor = 30) {
  if (!boton.classList.contains("completado")) {
    progreso += valor;
    if (progreso > 100) progreso = 100;

    boton.textContent = "Completado";
    boton.style.background = "green";
    boton.classList.add("completado");

    localStorage.setItem("progresoMatematicas", JSON.stringify(progreso));
    actualizarBarra();
  }
}

function responderReto(correcta, boton) {
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
