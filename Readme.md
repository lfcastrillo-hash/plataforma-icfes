# PrepICFES

Plataforma de preparación Saber 11 con HTML/CSS/JavaScript, Node.js/Express y PostgreSQL.
Conserva el diseño y contenido académico del proyecto original. No se requiere un framework frontend.

## Requisitos e instalación

Node.js 22 o posterior (verificado con 24.14.1), npm y PostgreSQL para uso persistente.

~~~powershell
npm ci
npm --prefix backend ci
Copy-Item backend/.env.example backend/.env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
~~~

Guardar el valor generado como JWT_SECRET en backend/.env; configurar DATABASE_URL de una
base preparada. No publicar .env. OpenRouter es opcional: sin su clave/modelo el sitio inicia
y el chat informa que no está configurado. En producción JWT_SECRET es obligatorio y debe
contener al menos32 caracteres; usar una cadena aleatoria. DATABASE_SSL=true verifica TLS.

## Base de pruebas y ejecución

La preparación PostgreSQL nueva está en [esquema-base-datos.md](docs/tecnica/esquema-base-datos.md).
No se ejecutan migraciones automáticamente. Revisar el esquema antes de usar una base existente.

~~~powershell
npm start
~~~

Abrir http://localhost:3000. Sin base configurada la interfaz pública inicia y las operaciones
de datos responden indisponibilidad; eso no significa que exista una conexión exitosa.

Para explorar la aplicación completa con cuentas ficticias, sin servicios externos:

~~~powershell
node scripts/qa/local-test-server.cjs
~~~

Abrir http://127.0.0.1:3001. Cuentas estudiante@example.test y profesor@example.test;
contraseña de fixture para ambas: Prueba123! La base PostgreSQL WASM es aislada y temporal:
se descarta al terminar ese proceso. No usar este modo como almacenamiento de usuarios reales.

## Pruebas y evidencias

~~~powershell
node scripts/qa/test-report.cjs
npm run test:e2e
npm run qa:static
npm run qa:visual
node scripts/qa/performance.cjs
npm run metrics
~~~

Las pruebas de unidad/integración usan el ejecutor Node y PostgreSQL WASM real en memoria/disco
temporal. Los E2E usan Playwright con Chrome/Edge instalados; BROWSER_EXECUTABLE permite elegir
otro ejecutable Chromium. Se pueden descargar binarios con npx playwright install chromium.
La comparación visual tiene fixtures de API; los E2E funcionales no interceptan la red.

Los reportes están en evidencias/: JUnit/JSON/LCOV/texto, capturas, integridad y métricas JSON/CSV.
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

No se aplicaron cambios a producción ni se publicaron commits. Falta cotejar Supabase real,
probar OpenRouter con credenciales, suministrar el material ausente de Ciencias y recursos,
y ejecutar las herramientas externas y la aceptación humana. La automatización de navegador
no sustituye la aceptación formal de la docente.
