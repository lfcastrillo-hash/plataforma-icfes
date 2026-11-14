# Comparación de métricas

Medición final: 2026-11-14T22:06:51.302Z. Versión 1.1.0; commit de fuentes 29c870727dc3becc067ce0f41e25f173df4b6187.
Ámbito frontend/backend; huella SHA-256 1ab75aa1472afa368e487f0e94bf6f80168a0e72840498301c8af13cede76a26.
El alcance de métricas excluye dependencias, uploads, build, dist y coverage. Se incluyen migraciones SQL.

| Indicador | Base c071262, criterio nuevo | Implementación corregida |
|---|---:|---:|
| files | 50 | 66 |
| PLOC | 19530 | 18489 |
| NCLOC | 17926 | 17132 |
| CLOC | 353 | 313 |
| BLOC | 1251 | 1044 |
| mixed | 24 | 18 |
| functions | 292 | 312 |
| classes | 0 | 0 |
| commentDensity | 1.93 | 1.79 |

PLOC=NCLOC+CLOC+BLOC se verifica por ejecución. Las líneas mixtas pertenecen a NCLOC, no vuelven a sumarse como CLOC.
La densidad es CLOC/(NCLOC+CLOC)×100. La medición AST incluye funciones anónimas, callbacks y scripts inline:
por eso las 292 funciones de la base no son comparables directamente con las 147 funciones históricas de Sonar.
Las clases propias son 0; WMC/DIT/CBO/LCOM no aplican a clases implementadas y no se fabricaron clases para cambiarlos.

Sonar histórico: 50 archivos,19570 PLOC,17997 NCLOC,310 CLOC,1,7 % de comentarios.
Script original ejecutado al iniciar: 50 archivos,19530 PLOC,17926 NCLOC,353 CLOC,1,93 %.
Estas cifras se conservan como antecedentes. No hay nueva ejecución Sonar; sus instrucciones están en pruebas-sistema.md.

El original del script se conserva sin modificaciones en scripts/metrics/historico/.
El nuevo analizador usa AST para JavaScript/JSX; HTML detecta scripts/estilos inline; CSS/SQL usan escáner léxico.
No es una implementación del contador de Sonar: sus definiciones pueden diferir.
Se exportan detalle por archivo/lenguaje, funciones, clases y complejidad en JSON; el resumen por archivo también en CSV.

Recalcular: npm run metrics. Se vuelve a medir la base desde git y el árbol actual, con commit, fecha, versión y huella de contenido.
