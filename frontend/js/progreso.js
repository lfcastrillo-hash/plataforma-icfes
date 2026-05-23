function obtenerUsuario() {
  return JSON.parse(localStorage.getItem("usuarioActivo"));
}

async function guardarProgreso(valor) {
  const usuario = obtenerUsuario();

  try {
    await fetch("http://localhost:3000/api/progreso", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correo: usuario.correo,
        progreso: valor,
      }),
    });
  } catch (error) {
    console.log(error);
  }
}

async function marcarTema(boton, valor = 30) {
  let progreso = Number(document.querySelector(".progress").dataset.valor || 0);

  if (!boton.classList.contains("completado")) {
    progreso += valor;

    if (progreso > 100) {
      progreso = 100;
    }

    boton.textContent = "Completado";
    boton.style.background = "green";
    boton.classList.add("completado");

    const barra = document.querySelector(".progress");

    barra.style.width = progreso + "%";
    barra.textContent = progreso + "%";
    barra.dataset.valor = progreso;

    await guardarProgreso(progreso);
  }
}

function responderReto(correcta) {
  const mensaje = document.getElementById("mensajeReto");

  if (correcta) {
    mensaje.textContent = "Correcto ";
    mensaje.style.color = "green";
  } else {
    mensaje.textContent = "Intenta de nuevo";
    mensaje.style.color = "red";
  }
}
