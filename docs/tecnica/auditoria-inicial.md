# Auditoría inicial de PrepICFES

Fecha de intervención: 14 de noviembre de 2026, America/Bogota. Base: `c071262`.
Este expediente describe trabajo técnico y evidencias; no reemplaza el documento académico final.

## Fase 0 y alcance

Se revisaron rama, remoto, historial y cambios locales, y se ejecutó `git fetch --all --prune`.
`main` y `origin/main` tenían cero commits de diferencia. Se creó
`codex/mejoras-calidad-prepicfes`. El único archivo local sin seguimiento era
`medir-codigo.cjs`; su contenido original se conserva íntegro en
`scripts/metrics/historico/medir-codigo-original.cjs`.

No se ejecutaron reset, clean, force-push, despliegues ni operaciones sobre datos reales.
Los commits son exclusivamente locales. Había 3.878 archivos de dependencias versionados:
se retiraron del índice, conservando las instalaciones necesarias y los lockfiles.

## Línea base observada

- `node backend/server.js` falló al construir el cliente OpenRouter sin clave. No existía `backend/.env`.
- Con una cadena ficticia de proveedor y una URL deliberadamente inaccesible en `127.0.0.1:1`, el frontend inició en el puerto 3000; la conexión SQL falló como era esperado. No se invocó al proveedor.
- No había suite automatizada: el script de pruebas del backend era el marcador de npm que termina con error; la raíz no tenía comando de pruebas. Esto es inspección del script original, no una nueva ejecución aprobada.
- El script original sí fue ejecutado: 50 archivos, PLOC 19.530, NCLOC 17.926, CLOC 353, BLOC 1.251, 24 líneas mixtas, densidad 1,93 %, cero coincidencias de clases.
- Se capturaron las 20 páginas antes de cambiar fuentes, a 1440×1000 en Chrome headless. Solo las respuestas API fueron interceptadas con fixtures para fijar su aspecto; estas capturas no prueban integración con Supabase.

## Hallazgos verificados

| ID | Prioridad | Defecto inicial | Tratamiento |
|---|---|---|---|
| A01 | P0 | Contraseñas en texto plano en registro, login y perfil | scrypt con sal, migración explícita y prueba de compatibilidad |
| A02 | P0 | Secreto JWT literal y sin revocación al salir | Secreto de entorno, sesión SQL revocable, issuer/audience/algoritmo y expiración |
| A03 | P0 | Progreso/ranking sin autenticar, correo tomado de la petición | Autenticación, roles y consulta/escritura por ID |
| A04 | P0 | Profesor podía actuar sobre clases ajenas | Identidad de sesión, rol y propietario comprobados en servidor |
| A05 | P1 | Estado local de ejercicios compartido entre usuarios | Espacio de claves por ID, persistencia SQL y protección entre pestañas |
| A06 | P1 | Cambiar correo podía separar progreso e identidad | Relaciones por ID, transacción y columnas de correo de compatibilidad |
| A07 | P1 | Archivos sin tamaño/tipo controlados y disco efímero | Memoria limitada a 2 MiB, firmas de imagen, bytes en PostgreSQL |
| A08 | P1 | No existía `/api/estudiante/anuncios` | Endpoint limitado a inscripciones de la cuenta actual |
| A09 | P1 | Registro independiente usaba IDs HTML distintos | Compatibilidad con ambos formularios |
| A10 | P1 | Omitir durante feedback podía saltar/duplicar preguntas | Guardas de estado, una respuesta por pregunta y finalización idempotente |
| A11 | P1 | Puntaje mínimo 100 aunque no hubiera aciertos; resultados sobrescribían aprendizaje | Cálculo de práctica 0–500 compartido y recalculado en servidor; tabla separada de resultados |
| A12 | P1 | URLs localhost incrustadas, fallos de API silenciados | Peticiones del mismo origen; estado local pendiente y avisos de sincronización |
| A13 | P1 | Biografía, anuncios y chat interpolados como HTML | Escape de texto, conservación de etiquetas/estilos existentes |
| A14 | P1 | CORS reflejaba cualquier origen, mensajes internos expuestos y logs de claves | Lista explícita, controles de origen, errores genéricos y logs sin secretos |
| A15 | P2 | CSS/HTML podían alterarse durante la refactorización | Hashes de CSS, comparación de markup/bancos y 20 pares de capturas |
| A16 | P2 | `clases.html` cargaba `js/clases.js`, que no existía | Controlador de pantalla añadido conservando su presentación |
| A17 | P1 pendiente | Ciencias ofrece 16 ejercicios, pero declara 5×8 | Se preservó el contenido; falta material académico para los otros 24 |
| A18 | P2 pendiente | 8 PDF locales ausentes y 6 enlaces placeholder | Mensaje de indisponibilidad; se requieren los recursos originales |
| A19 | P1 pendiente | No se dispone del esquema vivo de Supabase ni credenciales | Migraciones sobre esquema inferido y base WASM; cotejo real pendiente |
| A20 | P2 | Dependencias versionadas y seis avisos npm durante instalación | Lockfiles actualizados; auditoría posterior sin avisos en ambos paquetes |
| A21 | P2 | Selector por área anunciaba40/30 preguntas con bancos de21/20/15/15/15 | Contadores derivados del banco, conservando elementos/estilos; general85 sin cambios |
| A22 | P1 | Se anunciaba poder retomar, pero recargar reiniciaba preguntas/respuestas | Intento por usuario, orden de IDs, opciones, tiempo acumulado y resultado idempotente recuperables |
| A23 | P1 | Fotos antiguas podían contener nombres interpolados o archivos activos servidos por static | Escape de atributos y fallback histórico limitado a PNG/JPEG/WebP con CSP sandbox |

P0: acceso, confidencialidad o integridad inmediata. P1: funcionamiento o persistencia.
P2: soporte, calidad o recursos incompletos. La prioridad no implica que una prueba externa haya sido ejecutada.

## Límites observados

El control JSX `ChatIA.jsx` no está importado por ninguna página; es un artefacto histórico,
no el chat activo. El controlador Gemini tampoco era el endpoint usado: `/api/chat` usaba OpenRouter.
La implementación final unifica ese endpoint con su controlador OpenRouter.
No se consultaron ni migraron usuarios reales. El esquema de producción sigue sin inspeccionarse.
