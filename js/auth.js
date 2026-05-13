async function registrarUsuario() {
  const nombre = document.getElementById("nombreRegistro").value.trim();
  const correo = document.getElementById("correoRegistro").value.trim();
  const password = document.getElementById("passwordRegistro").value.trim();
  const rol = document.getElementById("rolRegistro").value;

  const mensaje = document.getElementById("mensajeRegistro");

  if (!nombre || !correo || !password) {
    mensaje.textContent = "Todos los campos son obligatorios";
    mensaje.style.color = "red";
    return;
  }

  try {
    const respuesta = await fetch("http://localhost:3000/api/registro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre,
        correo,
        password,
        rol,
      }),
    });

    const data = await respuesta.json();

    if (!data.success) {
      mensaje.textContent = data.mensaje;
      mensaje.style.color = "red";
      return;
    }

    mensaje.textContent = "Registro exitoso";
    mensaje.style.color = "green";
  } catch (error) {
    console.log(error);
  }
}

async function iniciarSesion() {
  const correo = document.getElementById("correo").value.trim();
  const password = document.getElementById("password").value.trim();
  const rol = document.getElementById("rol").value;

  if (!correo || !password) {
    alert("Completa todos los campos");
    return;
  }

  try {
    const respuesta = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correo,
        password,
        rol,
      }),
    });

    const data = await respuesta.json();

    if (!data.success) {
      alert(data.mensaje);
      return;
    }

    const usuario = {
      correo,
      rol,
    };

    localStorage.setItem("usuarioActivo", JSON.stringify(usuario));

    if (rol === "estudiante") {
      window.location.href = "dashboard-estudiante.html";
    } else {
      window.location.href = "dashboard-profesor.html";
    }
  } catch (error) {
    console.log(error);
  }
}
