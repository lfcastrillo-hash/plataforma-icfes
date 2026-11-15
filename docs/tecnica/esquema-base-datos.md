# Esquema y preparación de datos

El esquema de Supabase vivo **no fue consultado**. Los nombres/columnas antiguos se infirieron
de consultas del repositorio. `001_esquema.sql` define una base nueva coherente con el código;
`002_compatibilidad_existente.sql` prepara una copia del esquema anterior y aborta ante incompatibilidades.
No se ejecutan migraciones al iniciar la aplicación.

```mermaid
erDiagram
 usuarios ||--o{ clases : imparte
 usuarios ||--o{ inscripciones : tiene
 clases ||--o{ inscripciones : contiene
 usuarios ||--o{ progreso_areas : avanza
 usuarios ||--o| progreso_estudiante : conserva_compatibilidad
 usuarios ||--o{ sesiones : autentica
 usuarios ||--o{ resultados_simulacro : realiza
 usuarios {
   integer id_usuario PK
   varchar nombre
   varchar email UK
   text password
   text rol
   text biografia
   bytea foto_datos
   text foto_tipo
   text foto_nombre UK
   text foto_perfil
 }
 clases {
   integer id_clase PK
   integer id_profesor FK
   varchar nombre_clase
   varchar codigo_acceso UK
   text anuncio
 }
 inscripciones {
   integer id_usuario PK,FK
   integer id_clase PK,FK
 }
 progreso_areas {
   integer id_usuario PK,FK
   text area PK
   text correo
   numeric progreso
   jsonb estado
 }
 progreso_estudiante {
   integer id_usuario PK,FK
   text correo
   numeric progreso_global
 }
 sesiones {
   uuid id_sesion PK
   integer id_usuario FK
   timestamptz expira
 }
 resultados_simulacro {
   uuid id_resultado PK
   integer id_usuario FK
   timestamptz fecha
   text modalidad
   jsonb resultado
 }
```

Los cinco porcentajes por área de `progreso_estudiante` permanecen en la tabla de compatibilidad;
los endpoints actuales leen la fuente consolidada `progreso_areas`. `correo` queda como dato auxiliar.
La migración no borra los avances históricos: asigna ID a partir de correo normalizado, mantiene
el detalle existente y actualiza correos auxiliares. Un avance que no pueda relacionarse provoca
rollback; debe resolverse manualmente, nunca adjudicarse arbitrariamente.

## Base local PostgreSQL de pruebas

Requiere Docker Desktop activo (estaba instalado, pero su daemon no estaba disponible durante la intervención).

```powershell
docker compose -f compose.test.yml up -d
$env:TEST_DATABASE_URL='postgresql://prepicfes_test:fixture_local_only@127.0.0.1:5433/prepicfes_test'
node scripts/db/prepare.cjs new
```

El nombre de base debe terminar en `_test`. Los scripts rechazan `DATABASE_URL` y nunca la
usan como sustituto de `TEST_DATABASE_URL`. No se ejecutó este recorrido Docker en este equipo.

Copiar `backend/.env.example` a `backend/.env`, generar JWT_SECRET aleatorio y conservarlo fuera
de Git. El ejemplo apunta exclusivamente a la base local del compose. Para TLS remoto usar
`DATABASE_SSL=true` y certificados confiables; no se desactiva la validación de certificado.

## Copia restaurada del esquema histórico

1. Exportar esquema y respaldo con el equipo autorizado. No usar credenciales reales en evidencias.
2. Restaurar en una base `_test`; cotejar tipos, PK, FK, índices, defaults y columnas contra el SQL.
3. Ejecutar `node scripts/db/prepare.cjs legacy`. Todo se aplica dentro de BEGIN/COMMIT.
4. Corregir manualmente duplicados normalizados, inscripciones duplicadas o avances huérfanos si se produce rollback; conservar las filas originales.
5. Ejecutar `node scripts/db/hash-passwords.cjs` sobre esa copia para convertir contraseñas antiguas sin imprimirlas.
6. Validar conteos por tabla, relaciones, progreso e inicio de sesión con cuentas ficticias.

La alternativa temporal `ALLOW_LEGACY_PASSWORDS=true` convierte una clave antigua solo al iniciar
sesión correctamente. Mantenerla desactivada por defecto; retirarla después de la conversión.
Las claves antiguas no se normalizan ni recortan, para conservar acceso compatible.

La migración 002 elimina únicamente FK antiguas por correo en tablas de progreso, tras agregar
las FK por ID. Nuevos índices y CHECK rechazan datos incompatibles en vez de eliminarlos.
Las pruebas DB-MIG usan un esquema anterior reconstruido y prueban repetición y aborto por
duplicados. No demuestran equivalencia con el esquema remoto aún desconocido.

Una aplicación a producción requiere revisión y autorización separadas. No hay cron ni rutina
que ejecute estos scripts automáticamente. Las fotografías locales históricas deben inventariarse,
copiarse con respaldo y verificarse antes de retirar cualquier almacenamiento previo.
