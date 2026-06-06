const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

console.log("API KEY:", process.env.GEMINI_API_KEY);

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const pool = require("./db");

const authRoutes = require("./routes/auth.routes");
const progresoRoutes = require("./routes/progreso.routes");
const progresoAreasRoutes = require("./routes/progresoAreas.routes");
const clasesRoutes = require("./routes/clases.routes");
const perfilRoutes = require("./routes/perfil.routes");
const iaRoutes = require("./routes/ia.routes");

const app = express();

// ===============================
// MIDDLEWARES
// ===============================
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// ===============================
// RUTAS API
// ===============================
app.use("/api", authRoutes);
app.use("/api", progresoRoutes);
app.use("/api", progresoAreasRoutes);
app.use("/api", clasesRoutes);
app.use("/api", perfilRoutes);
app.use("/api", iaRoutes);

// ===============================
// ARCHIVOS ESTÁTICOS
// ===============================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.static(path.join(__dirname, "../frontend")));

// ===============================
// INICIAR SERVIDOR
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
