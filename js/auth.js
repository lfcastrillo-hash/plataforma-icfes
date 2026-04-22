function obtenerUsuarios() {
  return JSON.parse(localStorage.getItem("usuarios")) || [];
}

function guardarUsuarios(usuarios) {
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

function registrarUsuario() {
  const nombre = document.getElementById("nombreRegistro").value.trim();
  const correo = document.getElementById("correoRegistro").value.trim();
  const password = document.getElementById("passwordRegistro").value.trim();
  const rol = document.getElementById("rolRegistro").value;
  const mensaje = document.getElementById("mensajeRegistro");

  if (!nombre || !correo || !password) {
    mensaje.textContent = "Todos los campos son obligatorios.";
    mensaje.style.color = "red";
    return;
  }

  const usuarios = obtenerUsuarios();

  const existe = usuarios.find((usuario) => usuario.correo === correo);

  if (existe) {
    mensaje.textContent = "Ese correo ya está registrado.";
    mensaje.style.color = "red";
    return;
  }

  usuarios.push({ nombre, correo, password, rol });
  guardarUsuarios(usuarios);

  mensaje.textContent = "Registro exitoso. Ahora puedes iniciar sesión.";
  mensaje.style.color = "green";
}

function iniciarSesion() {
  const correo = document.getElementById("correo").value.trim();
  const password = document.getElementById("password").value.trim();
  const rol = document.getElementById("rol").value;

  if (!correo || !password) {
    alert("Debes completar todos los campos.");
    return;
  }

  const usuarios = obtenerUsuarios();

  const usuario = usuarios.find((user) => user.correo === correo);

  if (!usuario) {
    alert("El usuario no está registrado.");
    return;
  }

  if (usuario.password !== password) {
    alert("La contraseña es incorrecta.");
    return;
  }

  if (usuario.rol !== rol) {
    alert("El rol seleccionado no coincide con el usuario.");
    return;
  }

  localStorage.setItem("usuarioActivo", JSON.stringify(usuario));

  if (rol === "estudiante") {
    window.location.href = "dashboard-estudiante.html";
  } else {
    window.location.href = "dashboard-profesor.html";
  }
}
