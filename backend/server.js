const express = require("express");
const cors = require("cors");

const conectar = require("./db");

const authRoutes = require("./routes/auth.routes");
const progresoRoutes = require("./routes/progreso.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", progresoRoutes);

// PROBAR CONEXIÓN ORACLE
async function iniciarServidor() {
  try {
    await conectar();

    console.log("Oracle conectado correctamente");

    app.listen(3000, () => {
      console.log("Servidor corriendo en http://localhost:3000");
    });
  } catch (error) {
    console.log("Error conectando Oracle:");
    console.log(error);
  }
}

iniciarServidor();
