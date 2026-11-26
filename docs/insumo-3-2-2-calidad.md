# Insumo técnico para 3.2.2 y correcciones de calidad

Base cbf45e8; código medido dae2c8eadc8e39ff2e050bac09f892858fb13ac6. Generado con node scripts/metrics/quality-report.cjs. El PDF no se modifica.

## Tabla 1. Componentes reales

La responsabilidad se conserva por módulos: controladores HTTP, validadores, autenticación, persistencia, interfaz y evaluación académica; las funciones AST incluyen callbacks. No se equiparan funciones a métodos OO.

| Archivo / componente | Funciones y métodos reales | NCLOC | Suma de complejidades de funciones |
|---|---|---:|---:|
| frontend/areas.html | 3 funciones; 0 métodos de clase | 225 | 13 |
| frontend/cuadernillos.html | 1 funciones; 0 métodos de clase | 65 | 1 |
| frontend/js/aprendizaje.js | 34 funciones; 0 métodos de clase | 130 | 86 |
| frontend/js/auth.js | 7 funciones; 0 métodos de clase | 108 | 34 |
| frontend/js/clases.js | 2 funciones; 0 métodos de clase | 21 | 5 |
| frontend/js/panel-estudiante.js | 6 funciones; 0 métodos de clase | 179 | 33 |
| frontend/js/panel-profesor.js | 45 funciones; 0 métodos de clase | 468 | 110 |
| frontend/js/perfil-estudiante.js | 19 funciones; 0 métodos de clase | 195 | 47 |
| frontend/js/perfil-profesor.js | 15 funciones; 0 métodos de clase | 139 | 35 |
| frontend/js/perfil.js | 4 funciones; 0 métodos de clase | 68 | 16 |
| frontend/js/prep.js | 31 funciones; 0 métodos de clase | 109 | 68 |
| frontend/js/progreso.js | 5 funciones; 0 métodos de clase | 46 | 11 |
| frontend/js/simulacro-core.js | 11 funciones; 0 métodos de clase | 58 | 64 |
| frontend/js/simulacro.js | 4 funciones; 0 métodos de clase | 40 | 8 |
| frontend/js/water-loader.js | 7 funciones; 0 métodos de clase | 80 | 14 |
| frontend/simulacro-nuevo.html | 41 funciones; 0 métodos de clase | 827 | 112 |
| frontend/simulacro-selector.html | 10 funciones; 0 métodos de clase | 653 | 16 |
| backend/controllers/auth.controller.js | 4 funciones; 0 métodos de clase | 41 | 21 |
| backend/controllers/clases.controller.js | 17 funciones; 0 métodos de clase | 75 | 37 |
| backend/controllers/perfil.controller.js | 5 funciones; 0 métodos de clase | 44 | 29 |
| backend/controllers/progreso.controller.js | 4 funciones; 0 métodos de clase | 15 | 4 |
| backend/controllers/progresoAreas.controller.js | 7 funciones; 0 métodos de clase | 27 | 20 |
| backend/db.js | 1 funciones; 0 métodos de clase | 5 | 1 |
| backend/lib/catalogo-aprendizaje.js | 7 funciones; 0 métodos de clase | 30 | 25 |
| backend/lib/csp.js | 6 funciones; 0 métodos de clase | 19 | 19 |
| backend/lib/database-config.js | 6 funciones; 0 métodos de clase | 37 | 36 |
| backend/lib/images.js | 2 funciones; 0 métodos de clase | 22 | 25 |
| backend/lib/passwords.js | 2 funciones; 0 métodos de clase | 23 | 16 |
| backend/lib/progress.js | 11 funciones; 0 métodos de clase | 40 | 47 |
| backend/lib/transaction.js | 1 funciones; 0 métodos de clase | 6 | 2 |
| backend/lib/validation.js | 8 funciones; 0 métodos de clase | 15 | 22 |
| backend/middlewares/access.js | 3 funciones; 0 métodos de clase | 8 | 8 |
| backend/middlewares/accountLimit.js | 3 funciones; 0 métodos de clase | 15 | 6 |
| backend/middlewares/rateLimit.js | 4 funciones; 0 métodos de clase | 17 | 12 |
| backend/middlewares/verificarToken.js | 1 funciones; 0 métodos de clase | 19 | 11 |
| backend/routes/simulacros.routes.js | 4 funciones; 0 métodos de clase | 42 | 27 |
| backend/server.js | 16 funciones; 0 métodos de clase | 65 | 39 |

## Tabla 2. Aplicabilidad de métricas

| Métrica | Resultado / definición |
|---|---|
| Clases propias AST | 0; cero real |
| WMC | Solo suma de complejidades de métodos de una clase. Sin clases implementadas no hay observaciones; las sumas funcionales anteriores no son WMC. |
| DIT | Profundidad de herencia real; sin jerarquías OO no se calcula. |
| CBO | Dependencias entre clases reales; no equivale a contar imports entre módulos. |
| LCOM | El material del curso describe métodos que comparten atributos y su ejemplo aumenta al compartirlos. No se debe mezclar ese indicador con CK LCOM1=max(pares sin atributos compartidos menos pares con atributos compartidos,0). Sin clases no se calcula ninguna variante. |
| Complejidad funcional | 1 + if, ternarios, bucles, catch, operadores lógicos y casos switch no default; excluye funciones anidadas. AST Acorn. No es complejidad cognitiva de Sonar. |

Mantener arquitectura funcional: los controladores y utilidades no requieren instancias con estado para estos cambios. No se crean clases para alterar indicadores. El campo de cohesión se documenta por responsabilidad, sin asignar una cifra subjetiva.

## Tabla 3. Antes y después

| Medición | Base cbf45e8 | Código dae2c8e |
|---|---:|---:|
| files | 68 | 68 |
| PLOC | 18701 | 18731 |
| NCLOC | 17235 | 17270 |
| CLOC | 317 | 317 |
| BLOC | 1149 | 1144 |
| functions | 342 | 357 |
| classes | 0 | 0 |

La reorganización incorpora control de concurrencia y cola de resultados, sin cambiar tablas SQL ni contratos de respuesta. Duplicación Sonar después: pendiente de nuevo análisis, no se deduce del número de líneas. Los JSON incluyen archivos, funciones, líneas, complejidad y SHA-256 de fuentes.

## Tabla 4. SonarQube Cloud

Último análisis remoto observado: 2026-11-15T23:15:21Z, revisión cbf45e8.

| Indicador | Anterior comprobado | Nuevo | Criterio |
|---|---|---|---|
| Quality Gate | ERROR | Pendiente | OK |
| Fiabilidad nueva | E | Pendiente | A |
| Duplicación nueva | 14,4 % | Pendiente | ≤3 % |
| Cobertura | Sin datos remotos | LCOV local generado; importación pendiente | No se inventa umbral |

La API devolvió 371 incidencias abiertas de distintas categorías, no 371 bugs. issues.json y clasificacion.json conservan reglas, severidad, archivos y localización. Debe consultarse el período de código nuevo para clasificar las nuevas. No se rebajaron condiciones ni se añadieron exclusiones.

## Tabla 5. Evidencias

| Comprobación | Comando | Registro y alcance |
|---|---|---|
| Dependencias | npm ci --ignore-scripts; npm --prefix backend ci | Ejecutadas; 0 avisos en instalación. Raíz no requiere scripts de instalación |
| Regresión y cobertura | QA_EVIDENCE_ROOT=docs/sonar-evidencias/actual npm run test:coverage | actual/pruebas-unitarias/resultados.json, junit.xml, lcov.info y ejecucion.txt. PostgreSQL WASM aislado; no Supabase |
| Navegador | QA_EVIDENCE_ROOT=docs/sonar-evidencias/navegador npm run test:e2e | navegador/aceptacion/resultados.json; Chrome/Edge HTTP local |
| Métricas | node scripts/metrics/quality-report.cjs | metricas-actual.json; base y fuente trazables |

## Pendientes y reproducción remota

No se hizo escaneo nuevo: SONAR_TOKEN no está configurado. No hubo push, merge, despliegue, migración ni escritura en Supabase. Las pruebas controladas de concurrencia no sustituyen un ensayo de PostgreSQL nativo. Permanecen por trabajar los demás hallazgos de fiabilidad, accesibilidad/HTML/CSS, complejidad y bloques de duplicación remota. Este informe es parcial y no declara terminada la tarea.

Para escaneo manual autorizado, proporcionar SONAR_TOKEN por entorno y la organización real; generar cobertura fresca y ejecutar sonar-scanner -Dsonar.projectKey=lfcastrillo-hash_plataforma-icfes -Dsonar.organization=ORGANIZACION -Dsonar.sources=frontend,backend -Dsonar.javascript.lcov.reportPaths=docs/sonar-evidencias/actual/pruebas-unitarias/lcov.info. Conservar el enlace a la tarea CE, el SHA de esta rama y la respuesta project_status tras finalizar; no confundir el análisis existente de main con este código. La configuración de Automatic Analysis y la cobertura de CI deben revisarse antes de cambiar de modalidad de análisis.
