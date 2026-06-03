function abrirChat() {
  let chat = document.getElementById("chatIA");

  if (chat) {
    chat.style.display = "block";
    return;
  }

  const div = document.createElement("div");
  div.id = "chatIA";

  div.innerHTML = `
    <div class="chat-header">
      <h3>🤖 Tutor ICFES IA</h3>
      <button onclick="cerrarChat()">✖</button>
    </div>

    <div id="mensajes" class="chat-mensajes"></div>

    <div class="chat-footer">
      <input
        id="inputIA"
        type="text"
        placeholder="Pregúntame cualquier tema..."
        onkeypress="if(event.key==='Enter') enviarMensaje()"
      />

      <button onclick="enviarMensaje()">
        Enviar
      </button>
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

  mensajes.innerHTML += `
    <div class="msg usuario">
      <b>Tú:</b><br>${texto}
    </div>
  `;

  input.value = "";

  mensajes.innerHTML += `
    <div class="msg ia" id="cargandoIA">
      ⏳ Pensando...
    </div>
  `;

  mensajes.scrollTop = mensajes.scrollHeight;

  try {
    const respuesta = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mensaje: texto,
      }),
    });

    const data = await respuesta.json();

    document.getElementById("cargandoIA").remove();

    mensajes.innerHTML += `
  <div class="msg ia">
    <b>IA:</b><br>
    ${data.respuesta || data.error || "Error desconocido"}
  </div>
`;
  } catch (error) {
    document.getElementById("cargandoIA").remove();

    mensajes.innerHTML += `
      <div class="msg ia">
        ❌ Error al conectar con Gemini.
      </div>
    `;

    console.error(error);
  }

  mensajes.scrollTop = mensajes.scrollHeight;
}
