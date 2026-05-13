const oracledb = require("oracledb");

async function conectar() {
  try {
    const conexion = await oracledb.getConnection({
      user: "system",
      password: "oracle",
      connectString: "localhost/XE",
    });

    console.log("Conectado a Oracle");

    return conexion;
  } catch (error) {
    console.log("Error de conexión:", error);
  }
}

module.exports = conectar;
