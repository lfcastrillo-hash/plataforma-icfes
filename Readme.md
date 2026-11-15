# PrepICFES

Plataforma de preparación Saber 11 con HTML/CSS/JavaScript, Node.js/Express y PostgreSQL.
Conserva el diseño original. Incluye cinco módulos con 40 ejercicios cada uno (200 en total),
un banco activo de 86 preguntas y las correcciones académicas autorizadas. No usa framework frontend.

## Alcance académico definitivo

Registro y sesión; roles estudiante/profesor; módulos académicos; simulacros con resultados;
progreso individual; clases, inscripciones y anuncios; perfiles/fotografías; persistencia PostgreSQL.
OpenRouter y el asistente IA están excluidos del producto y de la documentación académica.

La tarjeta Recursos ICFES da acceso a tres cuadernillos oficiales y al catálogo de cinco áreas.
Los ocho PDF por año/sesión, dos grabaciones y tres Drive no acreditados figuran como no disponibles,
sin enlaces funcionales rotos. No se inventaron ni se redistribuyeron esos materiales.

## Requisitos e instalación

Node.js 22 o posterior (verificado con 24.14.1), npm y PostgreSQL para uso persistente.

~~~powershell
npm ci
npm --prefix backend ci
Copy-Item backend/.env.example backend/.env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
~~~

Guardar el valor generado como JWT_SECRET en backend/.env; configurar DATABASE_URL de una
base preparada. No publicar .env. El asistente de IA fue excluido por acuerdo del equipo y la profesora. No se usa OpenRouter ni se requieren sus credenciales. Ver docs/tecnica/alcance-actual.md. En producción JWT_SECRET es obligatorio y debe
contener al menos32 caracteres; usar una cadena aleatoria. DATABASE_SSL=true verifica TLS.

## Base de pruebas y ejecución

La preparación PostgreSQL nueva está en [esquema-base-datos.md](docs/tecnica/esquema-base-datos.md).
No se ejecutan migraciones automáticamente. Revisar el esquema antes de usar una base existente.

~~~powershell
npm start
~~~

Abrir http://localhost:3000. El arranque requiere una conexión PostgreSQL válida; si falla,
el proceso no abre el servidor. No confundir una interfaz estática con persistencia operativa.

Para explorar la aplicación completa con cuentas ficticias, sin servicios externos:

~~~powershell
node scripts/qa/local-test-server.cjs
~~~

Abrir http://127.0.0.1:3001. Cuentas estudiante@example.test y profesor@example.test;
contraseña de fixture para ambas: Prueba123! La base PostgreSQL WASM es aislada y temporal:
se descarta al terminar ese proceso. No usar este modo como almacenamiento de usuarios reales.

## Pruebas y evidencias

~~~powershell
npm run test:coverage
npm run test:e2e
~~~

Por defecto los fixtures usan PostgreSQL WASM aislado. El cierre también se verifica con `pg`
y PostgreSQL nativo local: [preparación y TLS](docs/tecnica/postgresql-local.md).
Con el entorno nativo ya preparado, desde PowerShell:

~~~powershell
$env:NODE_OPTIONS='--require=./scripts/qa/require-native.cjs'
$env:QA_EVIDENCE_ROOT=Join-Path 'evidencias' ('ejecucion-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
npm run test:coverage
$env:QA_EVIDENCE_ROOT=Join-Path $env:QA_EVIDENCE_ROOT 'nativas'
node --test --test-concurrency=1 --test-reporter=./scripts/qa/reporter.cjs tests/native/*.test.cjs
$env:QA_EVIDENCE_ROOT=Join-Path $env:QA_EVIDENCE_ROOT 'navegador'
npm run test:e2e
node scripts/qa/e2e-academico.cjs
node scripts/qa/visual-academico.cjs
node --use-system-ca scripts/qa/recursos.cjs
~~~

Usar siempre carpetas nuevas: los generadores históricos `qa:static`, `qa:visual`, `metrics`
y otros scripts antiguos tienen destinos fijos y pueden sobrescribir reportes anteriores.
Las configuraciones privadas de PostgreSQL nativo no se distribuyen; se generan localmente
siguiendo la guía, sin compartir secretos ni utilizar producción.

Los E2E usan Playwright con Chrome/Edge instalados; BROWSER_EXECUTABLE permite elegir
otro ejecutable Chromium. Se pueden descargar binarios con npx playwright install chromium.
La comparación visual tiene fixtures de API; los E2E funcionales no interceptan la red.
El comprobador visual conserva las capturas y el conteo real de píxeles distintos; admite solo
cuantización de un nivel RGB (1/255), con dimensiones y alfa exactos. No equivale a un cambio de CSS.

Los reportes nuevos pueden incluir JUnit/JSON/LCOV/texto, capturas y métricas JSON/CSV.
Las evidencias públicas seleccionadas y su procedencia se describen en
[publicacion-academica/INDICE.md](evidencias/publicacion-academica/INDICE.md).
Los paquetes completos permanecen en respaldos externos; no se publican perfiles, cookies,
bases, credenciales, certificados privados ni todas las capturas intermedias.
Los límites de cobertura y las verificaciones externas pendientes se explican en
[pruebas-sistema.md](docs/tecnica/pruebas-sistema.md).

## Organización

- frontend/: páginas originales, CSS conservado y JavaScript de interfaz.
- backend/: servidor, configuración, rutas, middlewares, controladores, utilidades y migraciones.
- tests/: unidad, integración, fixtures y preparación de pruebas de sistema.
- scripts/: QA, métricas y herramientas SQL restringidas a bases cuyo nombre termina en _test.
- docs/tecnica/: auditoría, arquitectura real, trazabilidad y pendientes para documentación.
- evidencias/: resultados verificables con fecha y alcance.

[Informe técnico final](docs/tecnica/informe-final.md) ·
[Inventario funcional](docs/tecnica/inventario-funcional.md) ·
[Arquitectura](docs/tecnica/arquitectura-real.md) ·
[Pruebas](docs/tecnica/trazabilidad-pruebas.md)

El [resumen definitivo](docs/tecnica/cierre-academico.md) distingue implementación, pruebas y exclusiones.
La versión académica está preparada para documentación y sustentación local. La aceptación docente,
las pruebas con personas reales y un eventual despliegue/Supabase real no se acreditan mediante
las suites locales. Los recursos secundarios no proporcionados quedan fuera de lo comprometido.
Esta publicación no ejecuta migraciones ni cambios de configuración en producción.
