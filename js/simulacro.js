let tiempo = 1500;

const timer = setInterval(() => {
  let minutos = Math.floor(tiempo / 60);
  let segundos = tiempo % 60;

  document.getElementById("timer").textContent =
    `${minutos}:${segundos.toString().padStart(2, "0")}`;

  tiempo--;

  if (tiempo < 0) {
    clearInterval(timer);
    finalizarSimulacro();
  }
}, 1000);

function finalizarSimulacro() {
  document.getElementById("resultado").textContent =
    "Simulacro finalizado. Puntaje estimado: 80/100";
}
