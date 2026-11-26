# Informe técnico del tercer lote Sonar

Rama codex/sonar-metricas-20261122. Conserva todos los commits anteriores. Producto comprobado en dae2c8e; el cambio posterior de e2e.cjs registra el error antes de intentar la captura para que un fallo del capturador no oculte el fallo del escenario.

## Diagnóstico por regla

La consulta pública con sinceLeakPeriod=true devolvió 33 incidencias nuevas. La consulta sin ese filtro devuelve 371 generales; el filtro inNewCodePeriod usado inicialmente no las distinguía y no debe emplearse como evidencia de código nuevo. Ambas respuestas originales se conservan. El último análisis remoto sigue siendo cbf45e8, del 15/11/2026. No se ejecutó un nuevo análisis.

diagnostico-reglas-sonar.md agrupa regla, severidad, total, nuevas y candidatas tratadas. sonar-evidencias/estado-local-por-incidencia.json conserva identificador, archivo, línea histórica, causa y tratamiento de las 371. Hay 30 candidatas corregidas localmente, incluidas 19 nuevas; NO son 30 cierres confirmados ni una nueva calificación de fiabilidad.

## Cambios efectivos

| Área | Cambio | Verificación |
|---|---|---|
| Configuración PostgreSQL | Separar URL, modo, TLS y parámetros numéricos; mismo contrato y validación de CA | Casos existentes de configuración y regresión completa |
| Errores HTTP | Sustituir ternarios anidados por selección explícita; mismos estados y mensajes | Integración HTTP |
| Simulacros | Quitar asignación sin uso y mejorar validación sintáctica sin tocar banco/respuestas | Integridad académica y CA03 |
| Fotografías | Comprobar que FileReader entrega cadena antes de generar vista previa | Regresión de perfiles; no sustituye validación binaria del servidor |
| Accesibilidad | Nombres accesibles de controles, asociaciones label-control y teclado Enter/Espacio en acciones sin controles hijos | Prueba nueva, CSP e integridad de HTML/estilos/imágenes |
| CSS | Eliminar solo primera copia de .progreso-celda; idéntica y completamente anulada por su última copia | AC03 comprueba igualdad de las dos reglas originales y equivalencia del resto del CSS |

La adaptación de AC03 no elimina una prueba fallida: mantiene la comparación completa y permite únicamente la retirada demostrada de esa regla. Las demás reglas y estilos inline permanecen idénticos. Las correcciones previas de login concurrente, integridad de simulacros, cambio rápido de clases y cola offline siguen incluidas en regresión.

## Verificaciones ejecutadas

| Prueba | Resultado | Registro |
|---|---|---|
| Unidad e integración final | 104 aprobadas, 0 fallidas | sonar-evidencias/lote3-final/pruebas-unitarias/resultados.json |
| Chrome, repetición completa | 7 recorridos y control JS aprobados | sonar-evidencias/lote3-chrome-repeticion/aceptacion/resultados.json |
| Edge | 7 recorridos y control JS aprobados | sonar-evidencias/lote3-final-browser/aceptacion/resultados.json |
| Primera ejecución Chrome | Incompleta después de CA01; no se suma como éxito completo | sonar-evidencias/lote3-final-browser.txt |
| LCOV | 26 archivos y 685 líneas con medidas válidas | validate-lcov.cjs sobre lote3-final/pruebas-unitarias/lcov.info |
| Cobertura V8 | 96,93 % líneas; 91,78 % ramas; 94,87 % funciones | lote3-final/pruebas-unitarias/ejecucion.txt; ámbito ejecutado, no todo el repositorio |

Entorno: HTTP loopback y PGlite/PostgreSQL WASM temporal. No se acredita PostgreSQL nativo ni Supabase con esas ejecuciones. No se repitieron cargas ni auditorías de producción. El descenso del porcentaje de líneas respecto al lote anterior se conserva: no se añadieron casos artificiales para elevarlo.

## Medición del código propio

| Medida | Base cbf45e8 | Tras lote anterior 88fbbc6 | Producto dae2c8e |
|---|---:|---:|---:|
| Archivos | 68 | 68 | 68 |
| PLOC | 18701 | 18720 | 18731 |
| NCLOC | 17235 | 17260 | 17270 |
| CLOC | 317 | 317 | 317 |
| BLOC | 1149 | 1143 | 1144 |
| Funciones AST, incluidos callbacks | 342 | 354 | 357 |
| Clases propias | 0 | 0 | 0 |

No se calculan WMC, DIT, CBO o LCOM de clases inexistentes. Las complejidades funcionales no se renombran como métricas OO. Los JSON incluyen ubicaciones y SHA-256. Comandos: node scripts/metrics/quality-report.cjs y node scripts/qa/sonar-local-status.cjs. El informe técnico previo contiene las definiciones; no se genera una nueva versión del apartado académico.

## Pendientes concretos y riesgos

De las 33 incidencias nuevas históricas, 19 tienen transformación local candidata; las otras 14 son 8 avisos de literales en migraciones, 2 avisos SQL que requieren revisión contextual, 3 avisos de ámbito de funciones UMD y 1 aviso de copia de un iterable. La copia de pending evita saltar elementos cuando sendPending retira acciones; no se elimina. La factoría UMD conserva exportación y ámbito privado; no se contamina el ámbito global solo para acallar la regla.

El aviso SQL de 003_contrato_final.sql:162 señala ON DELETE NO ACTION de una FK y no un DELETE ejecutable. El de 002_compatibilidad_existente.sql:44 señala normalización global intencional de correos. Se documentan para revisión humana, sin cambiar migraciones ni marcar falsos positivos en Sonar. Su impacto oficial solo lo determina un análisis y revisión autorizados.

Persisten duplicaciones de plantillas HTML y datos del banco (components.json), contraste, especificidad !important y transiciones, otras reglas CSS, controles compuestos y complejidad de vistas. No se sustituyen preguntas ni se fusionan reglas distintas de CSS sin analizar la cascada. Resolver ese resto puede modificar el renderizado o decisiones visuales, por lo que exige nuevas pruebas específicas; no se presenta como corregido. Las mejoras semánticas no equivalen a certificación WCAG ni a aprobación automática de todas las alertas HTML.

## Scanner y comprobación oficial pendiente

No hay autorización para análisis remoto. El workflow manual preparado se mantiene sin ejecutar, publicar o cambiar el proyecto. Usa secretos externos y LCOV fresco; no cambia condiciones del Gate ni excluye fuentes propias. La organización pública es lfcastrillo-hash. settings.json vacío no demuestra que Automatic Analysis esté apagado. El propietario debe comprobar Administration / Analysis Method, el plan y soporte de ramas antes de activar CI; evitar doble análisis.

Una vez autorizado: configurar SONAR_TOKEN de manera segura, confirmar organización/modalidad/plan, ejecutar regresión y validador LCOV, lanzar el scanner sobre el SHA aprobado, conservar report-task.txt, esperar Compute Engine y consultar el Gate por analysisId. Confirmar que project_analyses muestra la revisión correcta. Hasta entonces se conservan FAILED/E/14,4 % como últimos valores remotos, sin inventar valores posteriores ni considerar la tarea integral aprobada.

No se modificó el PDF académico. No hubo push, merge, despliegue, migración ni cambios de Supabase.
