const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatIA = async (req, res) => {
  try {
    const { mensaje } = req.body;

    if (!mensaje) {
      return res.status(400).json({
        error: "Debes enviar un mensaje",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `
Eres un tutor virtual de preparación para las pruebas ICFES de Colombia.

Reglas:
- Explica de forma sencilla.
- Ayuda a estudiantes de secundaria.
- Responde en español.
- Si es una pregunta matemática, muestra procedimiento paso a paso.
- Si es una pregunta de lectura crítica, explica el razonamiento.
- Mantén respuestas educativas.

Pregunta:
${mensaje}
`;

    const result = await model.generateContent(prompt);

    const respuesta = result.response.text();

    res.json({
      respuesta,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error al consultar Gemini",
    });
  }
};

module.exports = {
  chatIA,
};
