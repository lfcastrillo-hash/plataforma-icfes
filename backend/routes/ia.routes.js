const express = require("express");
const OpenAI = require("openai");

const router = express.Router();

console.log("================================");
console.log("OPENROUTER_API_KEY:");
console.log(
  process.env.OPENROUTER_API_KEY
    ? "API KEY CARGADA CORRECTAMENTE"
    : "API KEY NO ENCONTRADA",
);
console.log("================================");

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

router.post("/chat", async (req, res) => {
  try {
    const { mensaje } = req.body;

    if (!mensaje) {
      return res.status(400).json({
        error: "Debes enviar un mensaje",
      });
    }

    console.log("Consultando OpenRouter...");
    console.log("Pregunta:", mensaje);

    const completion = await openai.chat.completions.create({
      model: "openrouter/owl-alpha",
      messages: [
        {
          role: "system",
          content: `
Eres un tutor virtual especializado en las pruebas ICFES de Colombia.

Debes:
- Explicar de forma sencilla.
- Resolver dudas de estudiantes.
- Ayudar en Matemáticas, Lectura Crítica, Ciencias Naturales, Sociales e Inglés.
- Responder en español.
- Utilizar ejemplos cuando sea posible.
      `,
        },
        {
          role: "user",
          content: mensaje,
        },
      ],
    });

    const respuesta =
      completion.choices[0].message.content || "No pude generar una respuesta.";

    console.log("Respuesta recibida correctamente.");

    res.json({
      respuesta,
    });
  } catch (error) {
    console.error("ERROR OPENROUTER:");
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;
