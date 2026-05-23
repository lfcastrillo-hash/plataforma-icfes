const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");

const pool = require("./db"); 

const authRoutes = require("./routes/auth.routes");
const progresoRoutes = require("./routes/progreso.routes");
const clasesRoutes = require("./routes/clases.routes");
const perfilRoutes = require("./routes/perfil.routes"); 

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Tus rutas de la base de datos
app.use("/api", authRoutes);
app.use("/api", progresoRoutes);
app.use("/api", clasesRoutes);
app.use("/api", perfilRoutes); 

// Para que se vean las fotos de perfil
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ====================================================================
// 🚀 LA MAGIA: NODE.JS AHORA ES TU LIVE SERVER
// Como server.js está en la carpeta 'backend', usamos '../' para 
// decirle que tus HTML, CSS y JS están una carpeta más afuera.
// ====================================================================
app.use(express.static(path.join(__dirname, '../')));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor y Web corriendo juntos en http://localhost:${PORT}`);
});