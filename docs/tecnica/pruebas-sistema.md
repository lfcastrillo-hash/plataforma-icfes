# Sistema, seguridad y calidad

## Entorno y límites

Windows, Node24.14.1, npm11.11.0; Chrome y Edge headless instalados en el equipo.
Las pruebas funcionales usan HTTP real local y PostgreSQL WASM aislado. No se hicieron
peticiones de carga contra Supabase ni OpenRouter. Los reportes registran sus versiones reales.
`evidencias/sistema/rendimiento-local.json` contiene una microprueba secuencial de20 muestras
para cada uno de los cinco módulos, con errores, media, p50/p95/p99 y throughput.
La latencia de WASM y loopback no permite estimar capacidad de producción.

## Ejecución reproducible

```powershell
npm ci
npm --prefix backend ci
node scripts/qa/test-report.cjs
npm run test:e2e
npm run qa:static
npm run qa:visual
node scripts/qa/performance.cjs
npm run metrics
npm audit
npm --prefix backend audit
```

Si el entorno corporativo usa certificados del sistema, ejecutar `$env:NODE_OPTIONS='--use-system-ca'`
antes de npm. No usar `strict-ssl=false` ni desactivar TLS.
Las pruebas de navegador requieren Chrome/Edge o `BROWSER_EXECUTABLE`. Para un navegador
Playwright descargado: `npx playwright install chromium` y ajustar `scripts/qa/browser.cjs` o la variable.
Firefox/Safari no fueron ejecutados y no se declaran compatibles por estas pruebas.

## JMeter preparado, pendiente de ejecución con la herramienta

```powershell
node scripts/qa/local-test-server.cjs
# En otra terminal, con JMeter 5.6.3 o compatible instalado:
node scripts/qa/jmeter.cjs
jmeter -n -t tests/system/prepicfes-local.jmx -l evidencias/sistema/jmeter.jtl -e -o evidencias/sistema/jmeter-html
```

Servidor por defecto `http://127.0.0.1:3001`, exclusivamente datos ficticios. El JMX tiene cinco
grupos, un hilo y tres iteraciones cada uno, ejecutados en serie. Cookie Manager mantiene la
sesión. Son escenarios de humo; aumentar usuarios/carga requiere definir un objetivo y mantener
un entorno aislado autorizado. No cambiar el destino a producción.
No incluir bodies, cookies o cabeceras sensibles en los listeners/JTL. El XML se analizó como
XML en PowerShell; **no se ejecutó JMeter**, porque no estaba instalado en PATH.
Registrar p95/p99, porcentaje de errores y throughput del reporte al ejecutarlo, sin sustituirlos
por los valores de la microprueba Node.

## OWASP ZAP preparado, pendiente de ejecución

`tests/system/zap-local.yaml` es un plan de spider + análisis pasivo local, sin activeScan.
Con ZAP instalado en Windows, servidor ficticio en3001 y desde la raíz del repositorio:

```powershell
zap.bat -cmd -autorun tests/system/zap-local.yaml
```

Si el lanzador no está en PATH, usar su ruta instalada. El contexto solo incluye127.0.0.1:3001.
Este plan examina la superficie pública: la exploración autenticada requiere configurar
autenticación de ZAP en la base ficticia y demostrar que cada rol mantiene su sesión.
No se declara un escaneo aprobado ni cero vulnerabilidades ZAP: la herramienta no se ejecutó.
Los controles negativos HTTP de la suite sí están ejecutados y constan en su reporte.

## SonarQube Cloud/Server

No se dispuso de scanner/proyecto/token autorizado. Las métricas Sonar iniciales son históricas.
Después de los tests, para Cloud con un proyecto y organización propios:

```powershell
sonar-scanner -Dproject.settings=.sonarcloud.properties -Dsonar.host.url=https://sonarcloud.io -Dsonar.projectKey=CLAVE_DEL_PROYECTO -Dsonar.organization=ORGANIZACION
```

Definir `SONAR_TOKEN` mediante el gestor de secretos o entorno de la terminal; no incluirlo en el
comando, archivos ni capturas. Para Server usar su URL y omitir organización. El LCOV real está
en `evidencias/pruebas-unitarias/lcov.info`. Registrar ID del análisis, commit, fecha, duplicación,
complejidad y quality gate; **no hay un nuevo análisis Sonar aprobado en esta entrega**.

## Usabilidad y aceptación formal

Preparar sesiones con estudiantes/profesores para CA01–CA05. Registrar ID anónimo, tarea,
fecha, tiempo, éxito, errores y observaciones en `tests/system/usabilidad.csv`.
No se asignaron tiempos humanos ni resultados a personas que no participaron.
Los recorridos Playwright verifican acciones/expectativas, no sustituyen la aceptación de usuarios/docente.

## Fiabilidad y observación

`GET /api/health` responde200 si `SELECT1` funciona y503 si la base falla, sin cadena de conexión.
Hay prueba de fallo, rollback y recuperación de datos después de reiniciar la base local.
El proceso maneja SIGINT/SIGTERM cerrando HTTP/pool. En operación se debe registrar fecha de
caídas y recuperación; MTBF, MTTR y disponibilidad permanecen sin valor por falta de historial.
No se estimó un SLA ni se extrapoló disponibilidad desde una suite corta.

## Alcance visual

Las20 referencias/finales usan el mismo viewport, datos, semilla de mezcla y navegador. La API
se intercepta solo en esa comparación visual. Las pruebas E2E usan la API real, sin interceptar red.
CSS: hashes idénticos. Diecinueve capturas son idénticas. En el selector se corrigieron la descripción
de práctica y los cinco máximos de área (100 en lugar de500): se verificaron los rectángulos de
tarjeta, tabla, botón y textos contra el HTML inicial, sin desplazamiento de geometría y sin
diferencias de píxeles fuera de esas regiones. Se conservan las capturas finales reales, sin
reemplazar los textos para simular igualdad. Los contadores por área también se derivan del banco.
Markup educativo y banco: comparación con commit inicial y excepción explícita de las escalas. Diferencias
de contenido por datos nuevos (anuncios reales o nombre editado) son comportamientos esperados,
no cambios de diseño. No hay baseline móvil ni captura de todos los estados posibles de modales.
