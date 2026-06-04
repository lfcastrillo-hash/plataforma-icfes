function abrirChat() {
  let chat = document.getElementById("chatIA");

  if (chat) {
    chat.style.display = "flex";
    return;
  }

  const div = document.createElement("div");
  div.id = "chatIA";

  div.innerHTML = `
    <div class="chat-header">
      <h3>✨ Asistente IA</h3>
      <button onclick="cerrarChat()" class="btn-cerrar">✖</button>
    </div>
    <div id="mensajes" class="chat-mensajes"></div>
    <div class="chat-footer">
      <input id="inputIA" type="text" placeholder="Escribe aquí tu duda..." onkeypress="if(event.key==='Enter') enviarMensaje()" />
      <button onclick="enviarMensaje()" class="btn-enviar">➤</button>
    </div>
  `;

  document.body.appendChild(div);
}

function cerrarChat() {
  const chat = document.getElementById("chatIA");
  if (chat) {
    chat.style.display = "none";
  }
}

async function enviarMensaje() {
  const input = document.getElementById("inputIA");
  const mensajes = document.getElementById("mensajes");
  const texto = input.value.trim();

  if (!texto) return;

  // Imprimir mensaje del usuario
  mensajes.innerHTML += `
    <div class="msg usuario">
      ${texto}
    </div>
  `;

  input.value = "";
  mensajes.scrollTop = mensajes.scrollHeight;

  // Imprimir "Pensando..."
  mensajes.innerHTML += `
    <div class="msg ia" id="cargandoIA">
      ⏳ Pensando...
    </div>
  `;
  mensajes.scrollTop = mensajes.scrollHeight;

  try {
    // Buscar el token guardado en el navegador
    const token = localStorage.getItem("token") || "";

    const respuesta = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // AQUÍ ESTÁ LA SOLUCIÓN AL 401
      },
      body: JSON.stringify({ mensaje: texto }),
    });

    const data = await respuesta.json();
    document.getElementById("cargandoIA").remove();

    // Imprimir respuesta de la IA
    mensajes.innerHTML += `
      <div class="msg ia">
        ${data.respuesta || data.error || "Error desconocido"}
      </div>
    `;
  } catch (error) {
    document.getElementById("cargandoIA").remove();
    mensajes.innerHTML += `
      <div class="msg ia" style="color: red;">
        ❌ Error al conectar con el servidor.
      </div>
    `;
    console.error(error);
  }

  mensajes.scrollTop = mensajes.scrollHeight;
}