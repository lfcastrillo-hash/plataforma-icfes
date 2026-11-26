# PrepICFES — correcciones posteriores al primer análisis OIDC del PR #1

Fecha: 22/11/2026. Rama de trabajo codex/sonar-metricas-20261122; base publicada db0a560. No se ha hecho push, merge, despliegue, modificación de Supabase ni edición del PDF.

## Resultado y límites

109 pruebas unitarias/integración aprobadas, 0 fallidas: se conservan las 104 anteriores y se añaden 5 pruebas de comportamiento. Chrome y Edge: 14 recorridos y 2 controles JavaScript aprobados. Comprobaciones adicionales de teclado en ambos navegadores aprobadas. actionlint y git diff --check sin errores.

LCOV final: 29 archivos, 2.565 líneas instrumentadas; 2.129 cubiertas, 436 sin cubrir, 83,0019 % dentro de ese ámbito. prep.js: 92/112 líneas instrumentadas, 82,1429 %. Son líneas del reporter V8/Node, incluyendo líneas que Sonar puede considerar no ejecutables; no equivalen al denominador de código nuevo de Sonar. No es cobertura global del repositorio. El banco de simulacros ejecutado es parte del ámbito medido y no se utiliza su tamaño para afirmar cobertura oficial nueva.

La primera ejecución de este lote, antes del refactor de envío secuencial, permitió comparar directamente los números de línea con el análisis oficial: se ejecutaron 34 de las 51 líneas antes sin cubrir, incluidas las 32 de prep.js. El cálculo orientativo sobre el denominador anterior fue (77+34)/128*100 = 86,71875 %. Se conserva esa evidencia en comparacion-lineas.json. Después se modificó el envío secuencial y cambió la numeración; esa proyección no es un resultado oficial ni una garantía para el siguiente análisis. El LCOV final y el nuevo scanner determinan el porcentaje definitivo. No se ha declarado aprobado el Gate.

## Causa de la falta de cobertura frontend

scripts/qa/test-report.cjs solo incluía simulacro-core.js en frontend. Además, dos pruebas vm.runInContext omitían filename: sus ejecuciones no podían atribuirse al archivo real. Ahora se incluye frontend/js/**/*.js y los scripts VM usan su ruta real. Los tests nuevos ejecutan código real de prep.js, con DOM/almacenamiento/red simulados y aserciones sobre sus efectos. Se distinguen expresamente de pruebas en navegador.

Los recorridos E2E no exportaban cobertura. Ahora Playwright inicia cobertura V8 antes de navegar, conserva ejecuciones entre navegaciones y guarda los rangos efectivos al finalizar. En cada navegador se registraron 3 scripts de la página principal del recorrido. No incluye páginas de otros contextos ni se atribuye a Edge lo ejecutado en Chrome. Estos JSON V8 se entregan como evidencia separada: NO se convierten ni mezclan artificialmente con el LCOV de Node. No se exige instalar navegadores en el job OIDC para importar el LCOV de las pruebas unitarias/integración.

## Pruebas nuevas

1. Dos llamadas simultáneas comparten sincronización; un UUID incorporado durante la petición permanece y se envía después.
2. Un error HTTP conserva la cola y el evento online provoca un reintento exitoso.
3. Una edición de perfil válida persiste los datos y recarga.
4. Errores HTTP y de red conservan la sesión y no recargan.
5. El cambio de cuenta bloquea solicitudes protegidas antes de enviarlas y rechaza respuestas llegadas después del cambio.

## Las 31 incidencias oficiales

Se descargaron issues/search con pullRequest=1 y sources/lines de los ocho archivos indicados. Los JSON públicos originales están en docs/sonar-evidencias/pr1.

| Regla | Cantidad | Corrección local | Confirmación remota |
|---|---:|---|---|
| Web:S6819 | 28 | Botones nativos para 26 tarjetas/temas del selector y 2 acciones de ordenación dentro de encabezados de tabla. Se retiran role/tabindex/gestor de teclado redundantes; se adaptan estilos para conservar la presentación. | Pendiente |
| javascript:S3800 | 1 | connectionSecurityOptions retorna opciones con tipo objeto consistente. El contrato externo pg sigue utilizando ssl:false cuando corresponde y verificación TLS cuando es obligatoria. | Pendiente |
| javascript:S2681 | 1 | Guardia de FileReader con llaves e indentación correcta; no cambia la condición de aceptación. | Pendiente |
| javascript:S9382 | 1 | Cola secuencial mediante función asíncrona recursiva, sin await dentro de un bucle. Conserva detención ante error, orden, aislamiento y promesa compartida. | Pendiente |

No se han cerrado incidencias en Sonar ni marcado falsos positivos. Las pruebas históricas de integridad detectaron la adaptación del CSS; se mantuvo su comparación estricta salvo las transformaciones concretas para controles nativos. Durante el desarrollo hubo ejecuciones fallidas por esa expectativa desactualizada y una comprobación de teclado inicialmente enfocó una pestaña oculta. Se corrigieron las comprobaciones y la ejecución final completa fue aprobada; los informes finales no mezclan esos intentos.

## Dos advertencias

ce/component informa warningCount=2. La consulta pública de detalle ce/task con additionalFields=warnings no entregó el contenido (HTTP 404). No se conoce todavía el texto: no se afirma que sean advertencias de LCOV ni que estén resueltas. Para diagnosticarlas se necesita consultar en SonarQube, con sesión autorizada, el detalle de la tarea y las advertencias del análisis, o entregar el log completo del scanner del job. El LCOV se valida localmente por existencia de archivos, rutas y números de línea; la importación oficial sigue pendiente.

## Reproducir localmente

Desde work/prepicfes-calidad en PowerShell:

```powershell
$env:NODE_ENV='test'
$env:QA_DATABASE_ENGINE='pglite'
$env:QA_EVIDENCE_ROOT='.qa-sonar'
npm run test:coverage
node scripts/qa/validate-lcov.cjs .qa-sonar/pruebas-unitarias/lcov.info
$env:QA_EVIDENCE_ROOT='.qa-browser'
npm run test:e2e
```

Para E2E se requieren Chrome/Edge instalados en las rutas del helper scripts/qa/browser.cjs, o BROWSER_EXECUTABLE configurado. La suite usa HTTP de loopback y BD WASM temporal, sin Supabase. Los resultados finales están en docs/sonar-evidencias/pr1-verificado y pr1-browser-final. El fallo en una prueba hace fallar test:coverage; no se sustituyen contadores ni se convierten pruebas fallidas en aprobadas.

## Actualizar PR #1 — solo después de autorización

El workflow OIDC, sus permisos, .sonarcloud.properties, el Gate, vercel.json y las migraciones permanecen sin cambios en este lote. La rama remota exclusiva está en db0a560; main remoto consultado sigue en cbf45e85ac1f3a50a1520f23374eea54a1a99416. Las exclusiones Vercel fueron confirmadas por el usuario y funcionaron en el primer análisis; no se cambian aquí.

Comprobar estado, commit y remoto antes de publicar; detenerse si otra sesión avanzó la rama. Publicar únicamente el HEAD revisado a la rama exclusiva, sin force:

```powershell
git branch --show-current
git status --short --branch
git log -1 --oneline
git ls-remote --heads origin main ci/sonar-oidc-validation
git push origin HEAD:refs/heads/ci/sonar-oidc-validation
```

El PR #1 ya existe: NO crear otro ni fusionar. El push autorizado disparará synchronize del PR y el análisis OIDC. Verificar SHA, 109 pruebas, validación/importación LCOV, las 2 advertencias y las 31 incidencias. Comprobar cobertura nueva >=80 %, duplicación <=3 % y todas las condiciones originales del Gate. Un Gate del PR aprobado no actualiza por sí solo el Gate global histórico de main.
