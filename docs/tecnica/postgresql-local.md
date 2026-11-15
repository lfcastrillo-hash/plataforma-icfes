# PostgreSQL nativo local de PrepICFES

Esta fase es técnica. No modifica el documento académico, Supabase ni producción.
Base de fuentes: commit 785be5edc3ee70bcc9f03b0c7387d9823874af23 con cambios locales sin commit.
Los reportes nuevos están en `evidencias/postgresql-local-20261115/`; los anteriores se conservan.

## Entorno exclusivo

- Docker Desktop, contexto local `desktop-linux`.
- Contenedor `prepicfes-native-20261115`; volumen `prepicfes-native-20261115-data`.
- PostgreSQL 17.12; imagen fijada por digest en `compose.native-test.yml`.
- Puerto publicado exclusivamente en `127.0.0.1:55439`.
- Base `prepicfes_native_test`; cada fixture obtiene un esquema aleatorio `qa_*`.
- Credenciales ficticias aleatorias y JWT estable en `.qa-native/`, ignorado por Git.
- Los esquemas de prueba se conservan para inspección. No hay DROP DATABASE, TRUNCATE ni limpieza masiva.
- No se modifican los contenedores que existían antes de esta fase.

Primera creación en un entorno nuevo, desde la raíz, con Docker Desktop ya disponible:

```powershell
node scripts/db/create-native-env.cjs
docker compose -f compose.native-test.yml up -d --wait
node scripts/db/setup-native.cjs
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/db/enable-local-tls.ps1
```

El generador rechaza configuración privada, contenedor o volumen preexistentes; no regenera claves.
El script TLS usa el OpenSSL ya instalado con Git, sin instalar servicios ni certificados del sistema.
La CA y los certificados duran 30 días y solo sirven para este ensayo; no deben reutilizarse en producción.
Si hay material TLS existente, el script se detiene en vez de sobrescribirlo.

Inicio y parada posteriores, conservando datos y configuración:

```powershell
docker compose -f compose.native-test.yml up -d --wait
docker compose -f compose.native-test.yml stop
```

No usar `down -v`, `docker system prune`, ni borrar `.qa-native`: su eliminación requiere una decisión separada.
La parada del contenedor exclusivo está autorizada por el procedimiento; los demás contenedores no se tocan.

## Contrato y migraciones

`001_esquema.sql` y `002_compatibilidad_existente.sql` mantienen sus bytes originales.
Los caminos finales son `001 → 003` para una base nueva y `002 → 003` para una copia histórica revisada.
No se ejecuta 001 encima de una base histórica. Las migraciones no se ejecutan al iniciar la aplicación.
`scripts/db/prepare.cjs` aplica cada camino dentro de BEGIN/COMMIT y rechaza destinos remotos.
`TEST_DATABASE_URL` nunca se sustituye por `DATABASE_URL`; los secretos se configuran fuera del chat.

| Diferencia de la copia histórica | Contrato final de 003 |
|---|---|
| Faltaban PK en inscripciones y las dos tablas de progreso | PK compuestas usuario/clase, usuario/área y PK usuario |
| Nulabilidad más permisiva | NOT NULL en todas las columnas obligatorias del contrato |
| Faltaban límites de nombres, anuncio y porcentajes históricos/global | CHECK explícitos; preflight antes de añadirlos |
| FK históricas sin las reglas de borrado nuevas | CASCADE para dependencias del usuario y membresías; NO ACTION para profesor de clase |
| Diferencias TEXT/VARCHAR y defaults | Tipos, tamaños y defaults coherentes para los dos caminos |
| Índices únicos heredados heterogéneos | Índices finales de correo normalizado, nombre de foto y código de clase |

La migración bloquea las siete tablas durante el preflight y el DDL; no debe lanzarse sin ventana y
autorización en un servicio remoto. Detecta nulos, duplicados, huérfanos, porcentajes y longitudes inválidos.
No rellena nulos, no elimina duplicados, no adjudica huérfanos y no borra filas para satisfacer restricciones.
La transacción completa se revierte si alguna comprobación falla. Las PK incompatibles provocan aborto.
Las FK de las columnas gestionadas se reemplazan por las requeridas; no se usa DROP ... CASCADE.
Se conservan restricciones históricas adicionales: la equivalencia probada es la del contrato requerido,
no igualdad literal de todos los nombres o índices redundantes.

El contrato está en `scripts/db/schema-contract.cjs`. `build-corrective.cjs` reproduce únicamente 003,
sin conexión SQL. La comparación nativa verifica columnas, defaults, nulabilidad, PK, FK, CHECK e índices
finales, y repite 003 comprobando que el contrato no cambia. Conserva contraseñas y avances ficticios.
Una base histórica desconocida sigue necesitando inventario propio: la prueba usa el esquema inferido del repositorio.

## Conexión y arranque

`backend/lib/database-config.js` valida DATABASE_URL, DATABASE_MODE y las opciones de pool antes de conectar.
Modo `local-test`: solo loopback y base terminada en `_test`. Modo `production`: TLS obligatorio;
NODE_ENV=production no puede seleccionar otro modo. Los destinos remotos siempre requieren TLS.

- `DATABASE_SSL=true`: verifica certificado y nombre del servidor; nunca desactiva rejectUnauthorized.
- `DATABASE_CA_FILE`: PEM de una CA confiable, validado al cargarlo; puede omitirse si se confía en la CA del sistema.
- No se permiten parámetros sslmode, sslrootcert, sslcert, sslkey u otras opciones SSL en la URL.
- `DATABASE_POOL_MAX`: 1–50, por proceso; ajustar al presupuesto global de conexiones del despliegue.
- `DATABASE_CONNECT_TIMEOUT_MS`: 100–60000 ms.

El arranque ordinario consulta SELECT 1 antes de abrir el puerto HTTP. Una configuración o conexión
inválida produce un error sin imprimir URL, contraseña o certificados. El cierre libera el pool.
Las pruebas de reinicio lanzan dos procesos reales de backend/server.js con el mismo esquema y JWT.

## Roles y seguridad

Hay tres identidades locales: `prepicfes_migrator` es el bootstrap/superusuario inicial del contenedor
(nombre conservado de su creación; no es el usuario operativo de migraciones), `prepicfes_schema` es
el migrador sin superusuario/CREATEDB/CREATEROLE/BYPASSRLS, y `prepicfes_app` es el usuario de aplicación
con esas mismas capacidades administrativas deshabilitadas y sin permisos de DDL o TRUNCATE.
Solo el bootstrap configura los dos roles, la base y los privilegios iniciales.

| Tabla | Privilegios de prepicfes_app |
|---|---|
| usuarios | SELECT, INSERT, UPDATE |
| clases | SELECT, INSERT, UPDATE, DELETE |
| inscripciones | SELECT, INSERT, DELETE |
| progreso_areas | SELECT, INSERT, UPDATE |
| progreso_estudiante | SELECT, UPDATE |
| sesiones | SELECT, INSERT, DELETE |
| resultados_simulacro | SELECT, INSERT |

Se concede USAGE en esquema y secuencias, no propiedad ni GRANT OPTION. PUBLIC no tiene acceso al
esquema de aplicación ni privilegios de conexión a la base dedicada. El aislamiento entre estudiantes
se aplica en el backend con sesión SQL, identidad y autorización; el rol SQL compartido no separa filas por estudiante.

Supabase posterior debe ser un proyecto exclusivo y vacío con identificación autorizada explícitamente.
No basta con que la base se llame postgres o termine en _test. No se adaptaron estos scripts para conectar remotamente.
Conviene un esquema no expuesto a la Data API y retirar privilegios de anon/authenticated; si se exponen tablas,
configurar RLS y probar políticas y privilegios efectivos antes de habilitar accesos. No confiar en defaults del proyecto.
La autenticación propia de PrepICFES no establece auth.uid(): ninguna política basada en ella se presume funcional.
La aplicación no necesita Supabase Auth ni Storage; no se incorporan SDK ni claves service_role.

Referencia: [conexiones Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres),
[seguridad de acceso](https://supabase.com/docs/guides/database/secure-data),
[TLS de pg](https://node-postgres.com/features/ssl),
[restricciones PostgreSQL](https://www.postgresql.org/docs/17/ddl-constraints.html).

## Pruebas reproducibles con pg

Usar siempre una carpeta NUEVA de evidencia para no sobrescribir una ejecución:

```powershell
$env:NODE_OPTIONS='--require=./scripts/qa/require-native.cjs'
$env:QA_EVIDENCE_ROOT='evidencias/mi-ejecucion-nativa-fecha/regresion'
npm run test:coverage
$env:QA_EVIDENCE_ROOT='evidencias/mi-ejecucion-nativa-fecha/nativas'
node --test --test-concurrency=1 --test-reporter=./scripts/qa/reporter.cjs tests/native/*.test.cjs
$env:QA_EVIDENCE_ROOT='evidencias/mi-ejecucion-nativa-fecha/navegador'
node scripts/qa/e2e.cjs
node scripts/qa/visual-seguridad.cjs
Remove-Item Env:NODE_OPTIONS
```

El preloader configura únicamente la base local dedicada y bloquea cualquier carga de PGlite.
Los fixtures nativos usan pg.Pool sin mutex y un rol SQL de aplicación real. El resultado no se obtiene
simulando consultas. Las únicas respuestas API simuladas son las del comparador visual, para obtener
capturas deterministas; los E2E de aceptación utilizan HTTP y SQL reales.
Los esquemas históricos usan el rol migrador; los recorridos ordinarios usan el rol de aplicación.

## Respaldo y recuperación

`node --require ./scripts/qa/require-native.cjs scripts/db/backup-native.cjs` crea un esquema ficticio,
exporta con pg_dump -Fc y restaura con pg_restore en una segunda base local NUEVA dentro del contenedor.
No utiliza --clean, no sobrescribe una base y no toca producción. Guarda el dump exclusivamente en
`.qa-native/backups/`, ignorado por Git; solo el resumen y las comprobaciones se publican como evidencia.
Los propietarios y ACL se omiten expresamente y deben reaplicarse antes de usar el destino como aplicación.
El ensayo verifica un usuario ficticio y su avance de 45 %: no acredita recuperación de producción, roles
del clúster, fotos históricas del disco, PITR ni RPO/RTO operativos.

Para Supabase: definir respaldo, retención y objetivo de recuperación con el equipo; obtener autorización
para exportar; almacenar cifrado fuera de Git; restaurar en un proyecto aislado, revisar conteos, fotos,
secuencias, FK, roles y permisos; ensayar el cambio de aplicación y una reversión antes de una migración real.
La prueba local no sustituye ese procedimiento ni autoriza acceder a producción.
