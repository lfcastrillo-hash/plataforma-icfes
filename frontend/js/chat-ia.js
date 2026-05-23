function abrirChat() {
  let chat = document.getElementById("chatIA");

  if (chat) {
    chat.style.display = "block";
    return;
  }

  const div = document.createElement("div");
  div.id = "chatIA";
  div.style = `
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 300px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    padding: 10px;
  `;

  div.innerHTML = `
    <h3>Asistente IA</h3>
    <div id="mensajes" style="height:150px; overflow:auto; font-size:14px;"></div>
    <input id="inputIA" placeholder="Escribe..." style="width:100%; margin-top:5px;">
    <button onclick="enviarMensaje()">Enviar</button>
    <button onclick="cerrarChat()">Cerrar</button>
  `;

  document.body.appendChild(div);
}

function cerrarChat() {
  document.getElementById("chatIA").style.display = "none";
}

function enviarMensaje() {
  const input = document.getElementById("inputIA");
  const mensajes = document.getElementById("mensajes");

  const texto = input.value;

  mensajes.innerHTML += `<p><b>Tú:</b> ${texto}</p>`;

  let respuesta = "No tengo respuesta aún.";

  if (texto.toLowerCase().includes("álgebra")) {
    respuesta = "El álgebra estudia símbolos y operaciones matemáticas.";
  } else if (texto.toLowerCase().includes("icfes")) {
    respuesta = "El ICFES evalúa competencias en varias áreas.";
  }

  mensajes.innerHTML += `<p><b>IA:</b> ${respuesta}</p>`;

  input.value = "";
}
