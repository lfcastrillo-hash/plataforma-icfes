# PrepICFES: resumen definitivo para documentación y sustentación

Publicación autorizada posteriormente por el equipo: consultar [evidencias públicas seleccionadas](../../evidencias/publicacion-academica/INDICE.md). Las rutas `evidencias/cierre-academico-20261115/` de este resumen identifican el paquete íntegro histórico conservado fuera de Git, no archivos prometidos en la selección pública. Las ejecuciones nuevas identifican su commit probado en ese índice.

Fecha: 15/11/2026 (America/Bogota). Versión raíz 1.1.0 con modificaciones académicas y cierre de recursos locales SIN commit. Rama codex/mejoras-calidad-prepicfes, HEAD base a28beb7cce3d03560424c52e613ead91d2f081af. Las evidencias de esta entrega identifican además los SHA-256 de las fuentes; no atribuir cambios no confirmados al commit base. Este documento técnico sirve de insumo para la plantilla de Ingeniería de Software II; **no es el documento académico final** ni lo modifica. Sustituye las cifras de alcance actual de informes de fases anteriores, que conservan valor histórico.

## Dictamen y alcance definitivo

**Versión académica apta para documentar y sustentar en el entorno local comprobado.** No se detectaron fallos que impidan las ocho funcionalidades comprometidas. La aprobación de contenido/aceptación por la profesora y estudiantes reales no se sustituye por pruebas automatizadas. No se afirma disponibilidad de un despliegue público ni certificación de seguridad o de correspondencia curricular oficial.

Identificadores RF-C nuevos para el cierre; no reinterpretan silenciosamente los RF numerados de matrices históricas:

| Requisito definitivo | Implementación real | Evidencia y estado |
|---|---|---|
| RF-C01 Registrar e iniciar/cerrar sesión | Usuarios SQL, contraseñas scrypt, cookie HttpOnly con JWT y sesión revocable | Implementado y probado: integración, CA01/CA05, PG-N08 |
| RF-C02 Diferenciar estudiante/profesor y aislar datos | Middleware de autenticación, rol y propietario; identidad comprobada en SQL | Implementado y probado: integración de acceso y E2E de ambos roles |
| RF-C03 Ofrecer cinco módulos y 200 ejercicios | HTML/JS; 40 ejercicios por área, cinco temas con ocho ejercicios; claves y feedback | Implementado y probado: AC01–AC04; E2E general y dos recorridos completos de Ciencias |
| RF-C04 Ejecutar simulacros y persistir resultados | Banco activo de 86 preguntas, selección general de práctica de 85; cálculo validado en API y resultados por usuario/UUID | Implementado y probado: pruebas SimulacroCore, integración, CA03, PG-N08 |
| RF-C05 Guardar y recuperar progreso por usuario/tema | API, JSONB y tablas de progreso, catálogo/rangos validados; caché por ID | Implementado y probado: integración, CA02, PG-N06, PG-N08 y Ciencias 100 % tras recarga sin caché |
| RF-C06 Gestionar clases y estudiantes | Profesor crea/elimina clases, agrega/retira estudiantes y publica anuncio básico; estudiante consulta sus clases/anuncios | Implementado y probado: integración y CA04 |
| RF-C07 Consultar/actualizar perfil | Nombre/correo/biografía, fotografía validada por firma y decodificación, imagen persistida | Implementado y probado: integración, CA05 y PG-N08 |
| RF-C08 Persistir en PostgreSQL | pg/Pool, siete tablas, restricciones y transacciones; migraciones explícitas y arranque sin migraciones | Implementado y probado: 15 casos PostgreSQL nativo y suites HTTP locales |

## Recursos secundarios cerrados

Se mantuvieron las tarjetas, estructura, clases CSS y navegación. Cambiaron únicamente textos/destinos y atributos semánticos de disponibilidad en cinco HTML. Las cuatro tarjetas de Más Material ofrecen tres cuadernillos de práctica oficiales (Matemáticas, Lectura, Ciencias) y el catálogo oficial de cinco áreas. Los ocho archivos exactos por año/sesión, las dos grabaciones y los tres documentos Drive no se prometen en el alcance final: sus 13 acciones carecen de href, llevan aria-disabled y muestran disponibilidad de forma explícita. No hay LINK_AQUÍ, LINK_DRIVE ni rutas PDF ausentes como acciones funcionales.

Los cuatro destinos oficiales recibieron GET real: tres PDF devolvieron 206, application/pdf y firma %PDF- al solicitar 1.024 bytes; el catálogo devolvió 200 y contiene las cinco áreas. No se descargó un documento completo ni se guardaron cookies, perfiles o cuerpos privados. **Esto verifica acceso al archivo/página, no una revisión editorial completa de los PDF ni su disponibilidad futura.** No se afirma que los Drive puedan leerse o descargarse. No se inventaron grabaciones ni PDF, ni se alojaron copias de terceros. Se conservan los títulos/años de sesiones ausentes y no se cambia un examen de un año por otro bajo un rótulo falso.

URL exactas, antes/después y resultados: evidencias/cierre-academico-20261115/cierre-17-recursos-final.json, recursos-get-previo.json, cambios-recursos.json y enlaces-get-final.json. La tarjeta existente Recursos ICFES de Cuadernillos da entrada a Más Material; se cambió solo su título y destino, sin añadir menús ni tarjetas.

**OpenRouter y el asistente IA están excluidos definitivamente** del producto y de la documentación académica por acuerdo con la profesora. No hay proveedor, SDK, claves, componente activo ni botón IA; POST /api/chat responde 410 por compatibilidad, sin red externa. También quedan fuera de lo comprometido los recursos secundarios no proporcionados, comercialización, escalado y SLA de producción.

## Requisitos no funcionales verificables

| Requisito | Mecanismo existente | Verificación/límite |
|---|---|---|
| RNF-C01 Seguridad de acceso y datos | Cookie HttpOnly/SameSite; Secure en producción; JWT/sesión revocable; controles de rol/propietario; scrypt y consultas parametrizadas | Pruebas unitarias/integración y E2E; no es pentest ni garantía de invulnerabilidad |
| RNF-C02 Validación y protección HTTP | Catálogo/rangos de progreso, recálculo de simulacro en servidor, límites de solicitudes, validación real de imágenes y CSP con hashes de scripts | Pruebas existentes aprobadas; style-src conserva unsafe-inline por estilos originales. No se modificó CSS |
| RNF-C03 Integridad y persistencia | PK/FK/UNIQUE/CHECK/NOT NULL, transacciones y bloqueo concurrente; persistencia tras reiniciar proceso | PG-N01 a PG-N08 y variantes de preflight; TLS local con CA verificada y rechazos de CA/identidad |
| RNF-C04 Compatibilidad y estabilidad visual | HTML/CSS/JS sin framework; Chrome y Edge de escritorio | E2E de ambos; 20 páginas sin diferencias de diseño tras neutralizar textos, geometría de tarjetas intacta. No es matriz completa de navegadores/móviles ni WCAG |
| RNF-C05 Verificabilidad/mantenibilidad | Módulos funcionales, suites automatizadas, reportes JSON/JUnit/LCOV, inventarios y métricas AST | Artefactos y comandos reproducibles; no se añadieron clases o pruebas artificiales para elevar métricas |
| RNF-C06 Recuperabilidad y confidencialidad operativa | Respaldos externos de fuentes y evidencias con SHA-256; credenciales/configuración privada ignoradas por Git | Copias completas verificadas. Ambas en C:; no sustituyen copia en dispositivo independiente ni plan de recuperación del proveedor remoto |

No se fijan tiempos de respuesta, disponibilidad, capacidad simultánea, métricas de usabilidad o accesibilidad que no se hayan medido y acordado. Los resultados de rendimiento de otras fases son históricos, no ensayos de carga repetidos en este cierre.

## Arquitectura real y persistencia

- Cliente: HTML, tres CSS y JavaScript nativo; Prep centraliza sesión/peticiones/almacenamiento por usuario. aprendizaje.js gestiona ejercicios/progreso; banco-simulacro.js y simulacro-core.js centralizan banco y cálculo. El banco contiene las correcciones académicas autorizadas; ya no debe describirse como idéntico a la primera auditoría.
- Servidor: Node.js, Express 5, rutas y controladores funcionales, validadores y middleware. Sirve frontend y API del mismo origen. createApp admite un pool inyectado para pruebas. Autenticación por cookie/JWT con revocación SQL, sin JWT nuevo en localStorage. Los metadatos locales facilitan navegación, no autorizan acciones.
- Datos: driver pg, Pool y PostgreSQL. Tablas usuarios, clases, inscripciones, progreso_areas, progreso_estudiante, sesiones y resultados_simulacro. El anuncio es columna de clases; la fotografía nueva se almacena en usuarios (BYTEA/tipo/nombre), no es una tabla de anuncios/fotos aparte. Ejercicios y banco son archivos del producto, no un CMS SQL.
- Entorno probado: Windows/Node v24.14.1, PostgreSQL 17.12 en Docker local loopback 55439; fixture con esquemas aislados, usuarios ficticios y preloader que prohíbe PGlite. PGlite/WASM sigue como alternativa de pruebas existente, pero no fue el motor de las integraciones/nativas de este cierre.
- Migraciones: base nueva 001 → 003 y copia histórica 002 → 003, mediante herramientas explícitas autorizadas para ensayo local. Restricciones equivalentes, preflight y rollback comprobados. No se modificaron migraciones ni esquema de producción; el servidor no migra al arrancar.
- Despliegue: vercel.json incluye frontend/** y dirige a backend/api.js/createApp. La configuración y el servidor local están inspeccionados; Vercel/Supabase reales NO se desplegaron ni verificaron. TLS remoto es exigido por la configuración de pg.

## Diagramas para la plantilla

Actualizar/elaborar a partir del código actual, sin inventar subsistemas:

1. Casos de uso: actores estudiante/profesor y los ocho requisitos RF-C; sin actor/asistente IA.
2. Componentes/capas: navegador estático → API Express → middleware/controladores/validación → pg/Pool → PostgreSQL. Recursos ICFES solo como navegación externa opcional.
3. Entidad-relación: siete tablas anteriores, PK/FK, inscripción usuario-clase, profesor-clases, sesiones y resultados; no convertir siete tablas en siete clases JavaScript ficticias.
4. Secuencias: login/logout; responder/completar tema y recuperar progreso; enviar/recuperar simulacro; gestión de clase/estudiante; actualizar perfil/foto. Mostrar validación, permisos, transacción cuando corresponda y respuestas de error.
5. Despliegue: entorno local realmente probado (navegadores, Node/Express y Docker/PostgreSQL). Un despliegue remoto solo puede presentarse como configuración prevista no verificada.
6. Actividad o flujo de usuario: elegir módulo → responder → completar → persistir; selector → simulacro → resultado.

Si la plantilla exige diagrama de clases, representar el modelo de dominio como conceptual y aclarar que la implementación es funcional: cero clases declaradas propias según AST. Los diagramas existentes son insumos, no prueba de implementación independiente del código.

## Pruebas del cierre

| Grupo | Resultado comprobado | Ruta relativa a evidencias/cierre-academico-20261115/ |
|---|---|---|
| Unitarias/integración | 97 aprobadas, 0 fallidas | regresion-final/pruebas-unitarias/resultados.json, junit.xml, ejecucion.txt, lcov.info |
| PostgreSQL nativo | 15 aprobadas, 0 fallidas; migraciones, permisos mínimos, concurrencia, restricciones, reinicio y TLS | nativas-final/pruebas-unitarias/resultados.json, junit.xml |
| Chrome/Edge principales | 14 recorridos y 2 controles JS aprobados | navegador-final/aceptacion/resultados.json y PNG |
| Ciencias completa | 2 recorridos aprobados: 40 respuestas, 5 temas, cierre prematuro 409, 100 % persistido | navegador-final/academico-browser/resultados.json y PNG |
| Enlaces activos | 18 destinos únicos comprobados con GET, 0 fallos; 13 acciones desactivadas | enlaces-get-final.json |
| Navegación de recursos | 2 recorridos aprobados Chrome/Edge: entrada, retorno y acciones desactivadas | navegacion-recursos-validada.json |
| Diseño | 20 páginas aprobadas; 0 cambios de geometría de tarjetas | visual-final/resultados.json; *.actual.png y *.diseno.png |

La comparación visual utiliza API ficticia exclusivamente para estabilizar contenido; los E2E funcionales sí usan servidor HTTP/pg real. Para las cinco páginas de recursos se neutralizan solamente textos y atributos documentados de enlaces, conservando la captura actual sin neutralizar. No se afirma igualdad literal de píxeles de textos nuevos.

Cobertura informativa existente: 97.23 % líneas, 91.09 % ramas, 94.59 % funciones. Solo los 26 archivos ejecutados incluidos por backend/**/*.js y frontend/js/simulacro-core.js; excluye dependencias y no mide HTML/CSS, aprendizaje.js ni el banco. No se aumentó la cobertura mediante casos artificiales ni se la presenta como porcentaje de calidad global.

Para repetir sin sobrescribir, usar otra carpeta nueva de QA_EVIDENCE_ROOT y NODE_OPTIONS=--require=./scripts/qa/require-native.cjs con el entorno local ya autorizado; comandos npm run test:coverage, node --test --test-concurrency=1 --test-reporter=./scripts/qa/reporter.cjs tests/native/*.test.cjs, npm run test:e2e y node scripts/qa/e2e-academico.cjs. No ejecutar los generadores históricos que escriben en carpetas de evidencias anteriores.

## Pendientes de prueba y aceptación

- Profesora y estudiantes reales: aprobación editorial del contenido, ensayo de sustentación y aceptación de los ocho flujos. Calibración de dificultad, usabilidad y accesibilidad requieren usuarios/herramientas adecuadas; no equivalen a un fallo crítico detectado. No sustituir el criterio docente por el número de tests.
- Herramientas/entornos externos: despliegue real, red/pool/RLS de Supabase, carga, auditoría de seguridad y accesibilidad no se ejecutaron. **Supabase no bloquea la sustentación de PostgreSQL nativo local**; no afirmar que esas pruebas remotas pasaron. No se pide ni se usa producción para este cierre.
- PDF/Drive/grabaciones: descarga/lectura integral y derechos de materiales no verificados permanecen fuera de lo comprometido. Las acciones no disponibles ya no generan fallos de navegación.

## Herramientas y métricas disponibles

Git local y manifiestos SHA-256; Node test runner, reportes JSON/JUnit/LCOV; Playwright con Chrome/Edge; pg/PostgreSQL 17/Docker y pruebas TLS locales; parse5 para HTML, Acorn/AST para JavaScript y pngjs para comparación visual. Scripts QA y métricas existentes siguen disponibles. No se instaló ni se declaró ejecutado SonarQube, Qlty o una herramienta externa no registrada en esta entrega.

Medición actual de frontend/backend: **68 archivos; PLOC 18701; NCLOC 17235; CLOC 317; BLOC 1149; 342 funciones AST (incluidos callbacks); 0 clases propias declaradas; densidad de comentarios 1.81 %**. PLOC=NCLOC+CLOC+BLOC; las líneas mixtas están en NCLOC. El JSON incluye complejidad por función; no convertir el conteo de callbacks en métodos OO. Se excluyen node_modules, uploads, dist, build, coverage y .git; ámbito extensiones HTML/CSS/JS/JSX/CJS/MJS/SQL en frontend/backend. La medición está marcada workingTree/sourceDirty y tiene SHA-256 de fuentes.

## Datos necesarios para estimaciones de la plantilla

No inventar horas, costos, tamaño de equipo, productividad, puntos de función o cronograma. Obtener del equipo: integrantes/roles, dedicación y horas reales por fase, fechas y registros de esfuerzo, costos/tarifas y herramientas, infraestructura usada y supuestos. Si se usa COCOMO, declarar variante, unidad de tamaño y calibración; 17.235 NCLOC multilenguaje no equivalen automáticamente a KSLOC del modelo. Si se usan puntos de función, clasificar y justificar entradas/salidas/consultas, archivos lógicos e interfaces desde los ocho requisitos; siete tablas físicas no equivalen a siete archivos lógicos por defecto. Si se usan métricas OO, señalar no aplicabilidad al no haber clases propias. Separar esfuerzo histórico observado de estimación retrospectiva.

## Límites y recomendación

PrepICFES es una plataforma académica de preparación, no un examen oficial ni un sistema comercial certificado. Simulacro, pesos y dificultad son de práctica; contenido y citas preexistentes requieren aval editorial y trazabilidad docente. No hay pruebas humanas, carga/seguridad externas ni despliegue remoto acreditados. La configuración privada de QA y los certificados locales se mantienen fuera de Git. Los respaldos verificables de esta fase existen en Documents y Videos, ambos sobre C:, junto con los paquetes históricos intactos; la copia independiente depende del equipo.

**Cerrar desarrollo del alcance académico e iniciar documentación y sustentación.** No se requieren funciones nuevas, ampliaciones ni refactorizaciones para este objetivo. No se ha hecho staging, commits, push, merge, cambio de rama ni modificación de producción. Ese fue el estado al cerrar la fase; la instrucción posterior del usuario autoriza los commits y la integración a main.
