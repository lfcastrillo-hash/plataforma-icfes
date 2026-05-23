const preguntas = [
  { q: "5 + 3 =", opciones: ["6", "8", "10"], correcta: 1 },
  { q: "10 - 4 =", opciones: ["5", "6", "7"], correcta: 1 },
  { q: "2 * 3 =", opciones: ["5", "6", "7"], correcta: 1 },
  { q: "12 / 4 =", opciones: ["2", "3", "4"], correcta: 1 },
  { q: "9 + 1 =", opciones: ["10", "11", "12"], correcta: 0 },
];

let actual = 0;
let puntaje = 0;

function cargarPregunta() {
  const p = preguntas[actual];
  const contenedor = document.getElementById("pregunta");

  contenedor.innerHTML = `
    <h3>${p.q}</h3>
    ${p.opciones
      .map((op, i) => `<button onclick="responder(${i})">${op}</button>`)
      .join("")}
  `;

  document.getElementById("contador").textContent =
    `Pregunta ${actual + 1} de ${preguntas.length}`;
}

function responder(i) {
  if (i === preguntas[actual].correcta) {
    puntaje++;
  }
}

function siguiente() {
  actual++;

  if (actual < preguntas.length) {
    cargarPregunta();
  } else {
    document.getElementById("pregunta").innerHTML = "";
    document.getElementById("resultado").textContent =
      `Resultado: ${puntaje} / ${preguntas.length}`;
  }
}

cargarPregunta();
