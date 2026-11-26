# Estado técnico de la segunda etapa de calidad

Esta intervención conserva cbd4348, ab7c8ef y 1f08a2e. Código nuevo en 6faebc5 y preparación CI en 88fbbc6. El PDF no se modifica.

## Correcciones y duplicación

Se sustituyó la expresión regular de correo por una validación acotada de sus partes, preservando longitud, dominio y rechazo de caracteres peligrosos. Se eliminaron asignaciones embebidas y ternarios anidados del catálogo y del limitador por cuenta. Los manejadores asíncronos identificados ahora esperan las operaciones de perfiles, anuncios y clases. La prueba del limitador comprueba explícitamente que cada acceso permitido llega al siguiente middleware.

La operación de actualización de perfiles estaba repetida en perfil-estudiante.js y perfil-profesor.js. Ahora los dos adaptadores llaman a Prep.updateProfile; se conservan FormData, cookie/identidad, actualización de sesión, recarga y mensajes particulares de éxito. La nueva prueba verifica esos efectos. No se alteraron CSS ni las preguntas para reducir indicadores.

## Evidencia de duplicación remota

| Archivo | Bloques históricos | Líneas históricas duplicadas | Tratamiento |
|---|---:|---:|---|
| banco-simulacro.js | 22 | 549 | Contenido académico estructurado; sin exclusión ni modificación de preguntas |
| modulo-ciencias.html | 17 | 217 | Plantillas de ejercicios; sin cambiar el renderizado en esta fase |
| modulo-ingles.html | 26 | 293 | Plantillas de ejercicios |
| modulo-lectura.html | 13 | 215 | Plantillas de ejercicios |
| modulo-sociales.html | 19 | 287 | Plantillas de ejercicios |
| perfil-estudiante.js | 1 | 21 | Operación de actualización extraída a Prep |
| perfil-profesor.js | 1 | 25 | Misma operación compartida |

Fuente components.json, consulta pública de SonarQube. Las líneas entre archivos pueden solaparse: no sumarlas como líneas únicas. El porcentaje nuevo tras la extracción requiere un nuevo análisis; no se afirma que bajó de 3 %. Los bloques HTML y datos del banco siguen pendientes de una refactorización con pruebas de integridad editorial y visual. No se declaran falsos positivos ni se excluyen.

## Cobertura e integración

El LCOV es generado por scripts/qa/reporter.cjs a partir de cobertura V8. Registra DA por línea, no BRDA ni FN; por tanto no promete importación de ramas/funciones. validate-lcov.cjs comprueba que cada ruta sea interna y existente, que haya medidas y que las líneas no excedan el archivo ni estén duplicadas. Su denominador comprende fuentes ejecutadas; Sonar incluirá además las fuentes sin cobertura dentro de sonar.sources. No interpretar la cifra local como calidad global.

El workflow .github/workflows/sonar-quality.yml es manual: instala ambas dependencias, ejecuta regresión, genera cobertura fresca, valida LCOV y espera el Gate. Usa SONAR_TOKEN en GitHub Secrets y SONAR_ORGANIZATION en Variables; la API pública confirmó la organización lfcastrillo-hash. No imprime secretos. Las exclusiones de código y las condiciones del Gate se conservan.

La consulta settings/values devolvió settings vacío. Esto NO demuestra que Automatic Analysis esté apagado. No hay ejecuciones Actions previas en la revisión consultada. Antes de activar CI, el administrador debe comprobar en SonarQube Administration / Analysis Method si está habilitado Automatic Analysis y coordinar la transición; no ejecutar simultáneamente ambas modalidades. También debe comprobar el plan y soporte de análisis de ramas/PR. El workflow preparado no fue ejecutado ni publicado.

## Verificación remota pendiente

Falta SONAR_TOKEN en este entorno. Para verificar el Gate: autorizar la publicación o preparar un scanner local autenticado; confirmar modalidad/organización/plan; generar cobertura del SHA a analizar; ejecutar el scanner con project.settings=.sonarcloud.properties y sonar.javascript.lcov.reportPaths apuntando al LCOV recién validado; conservar report-task.txt, esperar la tarea de Compute Engine y consultar qualitygates/project_status con su analysisId. Comprobar también la revisión de project_analyses. No enviar estos resultados como si pertenecieran a cbf45e8.

Último análisis remoto observado: cbf45e8 del 15/11/2026, Gate ERROR, fiabilidad nueva E y duplicación nueva 14,4 %. No hay valor posterior probado. Tampoco se verificó PostgreSQL nativo, Vercel o Supabase en esta intervención.

## Límites del cierre

Permanecen hallazgos de complejidad, accesibilidad HTML, contraste, especificidad CSS, transiciones y duplicación de ejercicios/banco. Resolverlos conservando apariencia y contenido requiere comprobaciones visuales y editoriales adicionales; esta fase no los oculta ni declara corregidos. No está completada la corrección integral ni se garantiza aprobación remota. Los informes técnicos y métricas son insumos de medición, no una nueva versión del apartado académico.

## Resultados ejecutados de este lote

Regresión final: 103 pruebas, 0 fallidas; lote2-final/pruebas-unitarias/resultados.json. V8: 97,31 % líneas, 91,56 % ramas y 94,74 % funciones, solo ámbito ejecutado. LCOV validado: 26 archivos, 670 líneas medidas. Navegador: 14 recorridos y 2 controles JS aprobados, lote2-browser/aceptacion/resultados.json. Fuentes medidas en 88fbbc6: 68 archivos, 354 funciones AST, 0 clases; PLOC 18.720, NCLOC 17.260, CLOC 317, BLOC 1.143. Antes de este lote (ab7c8ef): 352 funciones, PLOC 18.744 y NCLOC 17.278. Estas diferencias no son un porcentaje de duplicación Sonar.

