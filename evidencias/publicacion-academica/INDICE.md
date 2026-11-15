# Evidencias públicas seleccionadas de PrepICFES

Repositorio: https://github.com/lfcastrillo-hash/plataforma-icfes

Esta selección no sustituye los paquetes completos externos. No se publican perfiles, cookies, certificados, bases, credenciales ni capturas intermedias repetidas.

## Referencia del cierre anterior a la publicación

- [Resumen original](referencia-cierre/resumen.json): resultados del cierre con cambios locales sobre a28beb7; NO es una ejecución nueva de publicación.
- [Métricas originales](referencia-cierre/metricas.json): 68 archivos frontend/backend y criterio de conteo.
- [Protección histórica](referencia-cierre/integridad-historica.json): 873 evidencias intactas durante el cierre.

Las ejecuciones sobre commits confirmados se añadirán aquí con su commit probado y procedencia. Los paquetes externos íntegros conservan los manifiestos originales de 235 y 177 archivos, además de los anteriores. La selección pública tendrá su propio manifiesto y no afirma contener esos paquetes completos.

## Verificación nueva de la rama

Commit de código confirmado: `53a8bdadf2d583a68f740f157a7fe6d4d08549ff`. [Resumen y procedencia](rama/RESUMEN.json).

| Evidencia | Resultado |
|---|---|
| [Unidad/integración](rama/unidad-integracion/resultados.json), [JUnit](rama/unidad-integracion/junit.xml), [LCOV](rama/unidad-integracion/lcov.info) | 97 aprobadas |
| [PostgreSQL nativo](rama/postgresql/resultados.json), [JUnit](rama/postgresql/junit.xml) | 15 aprobadas |
| [E2E](rama/e2e/resultados.json) | 14 principales + 2 controles JS |
| [Ciencias](rama/ciencias/resultados.json) | 2 recorridos completos |
| [Comparación visual](rama/visual/comparacion.json) | 20 páginas; conteo real y criterio incluidos |
| [Recursos GET](rama/recursos-get.json) | 18 destinos activos, 13 acciones no disponibles sin href |
| [Integridad académica](rama/integridad-academica.json) | 200 ejercicios y banco 86, sin incidencias estructurales/duplicados exactos |

Se conservan los [fallos de comparación exacta](rama/intentos-visuales/exacto-inicial.json) y la [repetición con fuentes listas](rama/intentos-visuales/fuentes-listas.json); no se cuentan como aprobados. El [diagnóstico](rama/diagnostico-cuantizacion.json) identificó cuantización de un nivel en PNG, sin cambio de fuente o CSS. Se publican los resultados validados con criterio explícito y capturas seleccionadas.

Galería seleccionada: [Ciencias](rama/visual/modulo-ciencias.html.png), [recursos](rama/visual/mas-material.html.png), [profesor](rama/visual/panel-profesor.html.png), [simulacro](rama/visual/simulacro-selector.html.png). Las 14 capturas de escenarios E2E están junto a su JSON; no se publican capturas intermedias ni referencias a archivos ausentes. [Dependencias y revisión de seguridad](rama/seguridad-dependencias.json).

## Verificación nueva del merge en main

Commit de código confirmado: `9198ddf03cf2e2c6a3013bad41dbdf5989d542ff`. [Resumen y procedencia](integracion/RESUMEN.json).

| Evidencia | Resultado |
|---|---|
| [Unidad/integración](integracion/unidad-integracion/resultados.json), [JUnit](integracion/unidad-integracion/junit.xml), [LCOV](integracion/unidad-integracion/lcov.info) | 97 aprobadas |
| [PostgreSQL nativo](integracion/postgresql/resultados.json), [JUnit](integracion/postgresql/junit.xml) | 15 aprobadas |
| [E2E](integracion/e2e/resultados.json) | 14 principales + 2 controles JS |
| [Ciencias](integracion/ciencias/resultados.json) | 2 recorridos completos |
| [Comparación visual](integracion/visual/comparacion.json) | 20 páginas; conteo real y criterio incluidos |
| [Recursos GET](integracion/recursos-get.json) | 18 destinos activos, 13 acciones no disponibles sin href |
| [Integridad académica](integracion/integridad-academica.json) | 200 ejercicios y banco 86, sin incidencias estructurales/duplicados exactos |

Los resultados integrados no duplican la galería de rama. El JSON E2E seleccionado omite solo referencias a capturas no publicadas y conserva todos los resultados; el hash del original completo figura en su procedencia. No se atribuyen capturas anteriores a una ejecución posterior.
