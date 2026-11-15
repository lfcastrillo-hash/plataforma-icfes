# Registro de corrección durante la ejecución

Fecha: 2026-11-14. Entorno: Node24.14.1, HTTP local y PostgreSQL WASM aislado.
Este registro resume la salida observada durante la intervención; no se presenta como una
ejecución adicional de la suite final.

La primera suite implementada produjo55 aprobadas y1 fallida de56. El caso
`IT02/CU03 progreso aislado, monotónico, persistente e idempotente` recibió un estado
con `completados: []` después de repetir la escritura, y la aserción obtuvo
`undefined !== 0`. La consulta SQL inicial de fusión JSONB no conservaba ese detalle.

Se sustituyó por una transacción con bloqueo del usuario, lectura del estado, unión de claves
y temas sin duplicados y UPSERT. La siguiente ejecución56/56 pasó. Posteriormente se amplió
la suite; sus resultados finales verificables están en `resultados.json`, `junit.xml` y
`ejecucion.txt`. No se reutilizan los conteos iniciales como conteos de la ejecución final.
