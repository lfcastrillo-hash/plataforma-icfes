const fs = require("node:fs");
const path = require("node:path");

const CARPETAS = ["frontend", "backend"];

const LENGUAJES = {
  ".html": "HTML",
  ".css": "CSS",
  ".js": "JavaScript",
  ".jsx": "JSX",
  ".cjs": "JavaScript",
  ".mjs": "JavaScript",
  ".sql": "SQL",
};

const EXCLUIR = new Set([
  "node_modules",
  "uploads",
  "dist",
  "build",
  "coverage",
  ".git",
]);

function obtenerArchivos(carpeta) {
  if (!fs.existsSync(carpeta)) {
    console.log("No existe:", carpeta);
    return [];
  }

  let archivos = [];

  for (const elemento of fs.readdirSync(carpeta, {
    withFileTypes: true,
  })) {
    const ruta = path.join(carpeta, elemento.name);

    if (elemento.isDirectory()) {
      if (!EXCLUIR.has(elemento.name)) {
        archivos.push(...obtenerArchivos(ruta));
      }
    } else if (elemento.isFile()) {
      const extension = path.extname(elemento.name).toLowerCase();

      if (LENGUAJES[extension]) {
        archivos.push(ruta);
      }
    }
  }

  return archivos;
}

function analizarArchivo(archivo) {
  const extension = path.extname(archivo).toLowerCase();
  const contenido = fs.readFileSync(archivo, "utf8").replace(/\r\n?/g, "\n");

  const lineas = contenido.split("\n");

  if (lineas[lineas.length - 1] === "") {
    lineas.pop();
  }

  let vacias = 0;
  let codigo = 0;
  let comentarios = 0;
  let mixtas = 0;

  let bloque = false;
  let comentarioHTML = false;
  let cadena = null;
  let dentroScript = false;
  let dentroStyle = false;

  for (const linea of lineas) {
    if (linea.trim() === "") {
      vacias++;
      continue;
    }

    let tieneCodigo = false;
    let tieneComentario = false;

    if (extension === ".html") {
      if (/<script\b/i.test(linea)) dentroScript = true;
      if (/<style\b/i.test(linea)) dentroStyle = true;
    }

    const modo =
      extension === ".html"
        ? dentroScript
          ? "js"
          : dentroStyle
            ? "css"
            : "html"
        : extension === ".css"
          ? "css"
          : extension === ".sql"
            ? "sql"
            : "js";

    let i = 0;

    while (i < linea.length) {
      const actual = linea[i];
      const siguiente = linea[i + 1];
      const dos = linea.slice(i, i + 2);
      const cuatro = linea.slice(i, i + 4);

      if (comentarioHTML) {
        tieneComentario = true;

        if (linea.slice(i, i + 3) === "-->") {
          comentarioHTML = false;
          i += 3;
        } else {
          i++;
        }
        continue;
      }

      if (bloque) {
        tieneComentario = true;

        if (dos === "*/") {
          bloque = false;
          i += 2;
        } else {
          i++;
        }
        continue;
      }

      if (cadena) {
        tieneCodigo = true;

        if (actual === "\\") {
          i += 2;
          continue;
        }

        if (actual === cadena) {
          cadena = null;
        }

        i++;
        continue;
      }

      if (modo === "html" && cuatro === "<!--") {
        comentarioHTML = true;
        tieneComentario = true;
        i += 4;
        continue;
      }

      if (modo !== "html" && dos === "/*") {
        bloque = true;
        tieneComentario = true;
        i += 2;
        continue;
      }

      if (modo === "js" && dos === "//") {
        tieneComentario = true;
        break;
      }

      if (modo === "sql" && dos === "--") {
        tieneComentario = true;
        break;
      }

      if (
        actual === "'" ||
        actual === '"' ||
        (modo === "js" && actual === "`")
      ) {
        cadena = actual;
        tieneCodigo = true;
        i++;
        continue;
      }

      if (!/\s/.test(actual)) {
        tieneCodigo = true;
      }

      i++;
    }

    if (cadena && cadena !== "`" && modo !== "sql") {
      cadena = null;
    }

    if (extension === ".html") {
      if (/<\/script\s*>/i.test(linea)) dentroScript = false;
      if (/<\/style\s*>/i.test(linea)) dentroStyle = false;
    }

    if (tieneCodigo) {
      codigo++;
    } else if (tieneComentario) {
      comentarios++;
    }

    if (tieneCodigo && tieneComentario) {
      mixtas++;
    }
  }

  return {
    lenguaje: LENGUAJES[extension],
    fisicas: lineas.length,
    vacias,
    codigo,
    comentarios,
    mixtas,
  };
}

const resultados = {};
const totales = {
  archivos: 0,
  fisicas: 0,
  vacias: 0,
  codigo: 0,
  comentarios: 0,
  mixtas: 0,
};

for (const carpeta of CARPETAS) {
  const archivos = obtenerArchivos(path.join(__dirname, carpeta));

  for (const archivo of archivos) {
    const datos = analizarArchivo(archivo);
    const lenguaje = datos.lenguaje;

    if (!resultados[lenguaje]) {
      resultados[lenguaje] = {
        archivos: 0,
        fisicas: 0,
        vacias: 0,
        codigo: 0,
        comentarios: 0,
        mixtas: 0,
      };
    }

    resultados[lenguaje].archivos++;
    totales.archivos++;

    for (const clave of [
      "fisicas",
      "vacias",
      "codigo",
      "comentarios",
      "mixtas",
    ]) {
      resultados[lenguaje][clave] += datos[clave];
      totales[clave] += datos[clave];
    }
  }
}

const porcentajeComentarios =
  totales.codigo + totales.comentarios > 0
    ? (
        (totales.comentarios / (totales.codigo + totales.comentarios)) *
        100
      ).toFixed(2)
    : "0.00";

console.log("\n====================================");
console.log(" MEDICION DE CODIGO - PREPICFES");
console.log("====================================");

console.log("\nRESULTADOS POR LENGUAJE:\n");
console.table(resultados);

console.log("\nRESULTADOS GENERALES:\n");
console.table(totales);

console.log("Densidad de comentarios:", porcentajeComentarios + "%");

console.log(
  "Comprobacion PLOC:",
  totales.codigo + totales.comentarios + totales.vacias,
  "/",
  totales.fisicas,
);

console.log("\nAnalisis terminado.");

console.log("\nCOMPROBACION POR CARPETA:");

let totalSaltosFinales = 0;

for (const carpeta of CARPETAS) {
  const archivos = obtenerArchivos(path.join(__dirname, carpeta));

  let lineasFisicas = 0;
  let saltosFinales = 0;

  for (const archivo of archivos) {
    const datos = analizarArchivo(archivo);

    lineasFisicas += datos.fisicas;

    const contenido = fs.readFileSync(archivo, "utf8");

    if (contenido.endsWith("\n")) {
      saltosFinales++;
    }
  }

  totalSaltosFinales += saltosFinales;

  console.log(
    `${carpeta}: ${archivos.length} archivos, ` +
      `${lineasFisicas} lineas fisicas, ` +
      `${saltosFinales} archivos con salto final`,
  );
}

console.log("Total de archivos con salto final:", totalSaltosFinales);

console.log("Diferencia fisica SonarQube - Node.js:", 19570 - totales.fisicas);

console.log("\n====================================");
console.log(" VERIFICACION DE CLASES - PREPICFES");
console.log("====================================");

let archivosRevisados = 0;
const clasesEncontradas = [];

for (const carpeta of CARPETAS) {
  const archivos = obtenerArchivos(path.join(__dirname, carpeta));

  for (const archivo of archivos) {
    const extension = path.extname(archivo).toLowerCase();

    if (![".js", ".jsx", ".html"].includes(extension)) {
      continue;
    }

    archivosRevisados++;

    const contenido = fs.readFileSync(archivo, "utf8");

    const patron =
      /\bclass(?:\s+[A-Za-z_$][\w$]*)?(?:\s+extends\s+[A-Za-z_$][\w$.]*)?\s*\{/g;

    for (const coincidencia of contenido.matchAll(patron)) {
      const linea = contenido
        .slice(0, coincidencia.index)
        .split(/\r\n|\r|\n/).length;

      clasesEncontradas.push({
        archivo: path.relative(__dirname, archivo),
        linea,
        declaracion: coincidencia[0],
      });
    }
  }
}

console.log("Archivos revisados:", archivosRevisados);
console.log("Posibles declaraciones de clases:", clasesEncontradas.length);

if (clasesEncontradas.length > 0) {
  console.table(clasesEncontradas);
} else {
  console.log("No se encontraron declaraciones con el patron analizado.");
}

console.log("\nVerificacion terminada.");
