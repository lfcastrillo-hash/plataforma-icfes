function crearClase() {
  const nombre = document.getElementById("nombreClase").value;
  const lista = document.getElementById("listaClases");
  const mensaje = document.getElementById("mensajeClase");

  if (nombre.trim() === "") {
    mensaje.textContent = "Escribe un nombre para la clase.";
    return;
  }

  const codigo = "ICFES" + Math.floor(Math.random() * 1000);

  const item = document.createElement("li");
  item.textContent = `${nombre} - Código: ${codigo}`;

  lista.appendChild(item);
  mensaje.textContent = "Clase creada correctamente.";
}
