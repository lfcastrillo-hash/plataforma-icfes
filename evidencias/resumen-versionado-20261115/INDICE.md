# Resumen versionado de evidencias

Versión 1.1.0. Las copias preservan los resultados y metadatos originales de las fases del 14 y 15 de noviembre de 2026.
Su commit base histórico es 785be5edc3ee70bcc9f03b0c7387d9823874af23; las pruebas se ejecutaron entonces con cambios locales identificados por hashes.
La organización posterior del código corresponde a 94af619b2338c2a0a916eeb43baf7add5dc4f2de. Esto no reetiqueta las ejecuciones históricas como pruebas de ese commit.

MANIFIESTO.json relaciona cada copia byte por byte con su archivo original y SHA-256. Se conservó también el resultado fallido inicial de permisos, sin sustituirlo por el reintento aprobado.

Los paquetes completos, capturas, registros y manifiestos permanecen fuera del versionado, íntegros en sus carpetas originales y respaldados externamente. Ninguna de esas carpetas debe agregarse automáticamente. Para revisar las capturas referenciadas por los JSON, restaurar el paquete completo en su ruta original y comprobar su manifiesto. Este resumen no contiene esas imágenes.

Los respaldos locales incluyen una copia completa, un ZIP verificado y el historial Git; su ubicación e integridad se entregan en el informe de la operación y no se publican en este índice. Los secretos locales, claves TLS, dumps y trazas privadas permanecen excluidos.

La validación posterior a los commits se guarda en un directorio externo nuevo, registra su HEAD exacto y no sobrescribe estos reportes. Los resultados de esa ejecución se entregan por separado. No se accedió a producción ni se realizó push.
