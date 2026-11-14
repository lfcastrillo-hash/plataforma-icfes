# Informe técnico de auditoría, corrección y organización

14 de noviembre de 2026, America/Bogota. Rama codex/mejoras-calidad-prepicfes.
Versión 1.1.0; fuentes verificadas en 29c870727dc3becc067ce0f41e25f173df4b6187; huella 1ab75aa1472afa368e487f0e94bf6f80168a0e72840498301c8af13cede76a26.
No se publicó ningún commit ni se modificó producción. Este informe no es el documento académico final.

## 1. Problemas encontrados

Contraseñas sin hash, secreto JWT literal, progreso público por correo, permisos docentes insuficientes,
mezcla de cuentas en almacenamiento/pestañas, rutas de anuncios/JS faltantes, perfil sin validaciones,
subida de archivos sin límites y dependiente de disco efímero, IA obligatoria al arrancar y errores expuestos,
simulacros con saltos/duplicados, puntaje mínimo arbitrario 100 y ausencia de recuperación de intento.
El inventario detallado A01–A23 se conserva en auditoria-inicial.md. Ciencias y recursos tienen faltantes de contenido.

## 2. Correcciones implementadas

scrypt con sal y parámetros explícitos; JWT de entorno con sesión SQL revocable; control de roles/propiedad
en servidor; identidad por ID, migración conservadora y transacciones; progreso aislado por cuenta y
pestaña con recuperación; perfil validado y foto almacenada en BD; anuncios según inscripción;
OpenRouter opcional con errores controlados; CORS/orígenes, límites y mensajes seguros;
resultados recalculados desde banco conservado, intento recuperable y calificación de práctica 0–500.
Se mantuvieron los bancos, opciones, respuestas, imágenes, cuadernillos y estilos. Se corrigieron textos
de escalas/contadores como defectos verificados de datos, sin cambiar geometría ni diseño.

## 3. Arquitectura final

Frontend HTML/CSS/JS; módulos funcionales compartidos Prep/aprendizaje/banco/simulacro-core.
Express con factoría createApp, middlewares, controladores y utilidades; PostgreSQL mediante pg.
Fotos/resultados/estado/sesiones persistidos en SQL. OpenRouter es un servicio opcional.
Cero clases propias declaradas: arquitectura funcional justificada, sin clases artificiales.
Diagramas e inventario en arquitectura-real.md, esquema-base-datos.md y secuencias-integracion.md.

## 4. Funcionalidades verificadas

Registro, login/logout, roles, dos paneles, cinco módulos con el material existente, progreso/repetición/recarga,
aislamiento entre cuentas/pestañas, modalidades de simulacro y revisión, recuperación de intento y resultado,
clases/inscripciones/retiros/propiedad/eliminación, anuncios, perfil/correo/clave/foto, transacciones y persistencia
local tras reinicio. OpenRouter se verificó solo con errores y stub explícito, sin fingir éxito del proveedor real.
El detalle RF01–RF24 está en inventario-funcional.md.

## 5. Pruebas ejecutadas

- Unidad/integración: 77 casos, 77 aprobados, 0 fallidos. Incluyen límites, equivalencias, rollback, migración repetible, duplicados y reinicio con foto/progreso.
- Cobertura V8: 97.40 % líneas, 91.29 % ramas y 91.95 % funciones, solo fuentes cargadas incluidas en el reporte; no todo el frontend ni archivos no importados.
- Navegador: 14 recorridos, 14 aprobados en Chrome/Edge; CA01–CA05 más variantes de pestañas/modalidad y recarga. 2 comprobaciones adicionales sin errores JavaScript.
- Visual: 20 páginas aprobadas; 19 idénticas píxel a píxel. Selector:7287 píxeles de texto corregido, cero diferencias fuera de esas regiones y geometría estable. CSS sin cambios.
- Integridad: 30 comprobaciones aprobadas; 176 ejercicios con 4 opciones y 1 correcta marcada; 86 preguntas de simulacro con índices válidos; ningún tema de selector sin preguntas.
- XSS en navegador: 3 páginas verificadas con texto y rutas históricas maliciosas ficticias, sin ejecutar código.
- Dependencias: npm audit raíz 0, backend 0 avisos. Escaneo de patrones de secretos: 0 hallazgos. No equivale a un escaneo ZAP.
- Rendimiento: 100 solicitudes locales, 0 errores; media, percentiles y throughput en el JSON. No es JMeter ni carga de producción.
- Instalación limpia npm ci en raíz/backend ejecutada correctamente; arranque público sin proveedor obligatorio verificado.

## 6. Pendientes y motivos

Supabase real: sin esquema/credenciales/base aislada autorizada. OpenRouter real: sin clave/modelo.
PostgreSQL nativo Docker: daemon no disponible. JMeter, ZAP y Sonar scanner: no instalados/configurados;
se prepararon escenarios/comandos sin declarar aprobación. Usuarios/docente: sin sesión de aceptación humana.
Faltan 24 ejercicios de Ciencias y 14 archivos/destinos de recursos (8 PDF y 6 placeholders). Los 3 enlaces
Drive requieren comprobación de permisos del propietario. Build/despliegue Vercel y Firefox/Safari pendientes.
Las fotos antiguas de disco requieren inventario/traslado si existían en el entorno desplegado.
Las claves locales globales históricas requieren confirmar propietario antes de importarlas.

## 7. Métricas

66 archivos, 18489 PLOC, 17132 NCLOC, 313 CLOC, 1044 BLOC, densidad 1.79 %, 312 funciones AST y 0 clases.
Base comparable: 50 archivos/19530 PLOC/17926 NCLOC. Cambia el alcance al agregar módulos y migraciones y reducir duplicación.
comparacion-metricas.md explica criterios, referencia histórica y límites de comparación con Sonar.

## 8. Evidencias y reproducción

Reportes JSON/JUnit/LCOV/texto/casos CSV; cinco grafos y secuencias; capturas iniciales/finales y E2E;
comparación de CSS/markup/banco; métricas JSON/CSV y seguridad/rendimiento. Contexto en evidencias/contexto-ejecucion.json.
Instalación y comandos en Readme.md, pruebas-sistema.md y esquema-base-datos.md.
Las trazas privadas no son evidencias entregables ni archivos versionados.

## 9. Archivos y commits locales

Se modificaron controladores/rutas, middleware/configuración/DB, JS y referencias de scripts del frontend,
paquetes/lockfiles y adaptador Vercel. Se agregaron migraciones, pruebas, scripts, documentación y evidencias.
Los 3 CSS no cambiaron. Listado de fuentes/herramientas en evidencias/archivos-modificados.txt.

~~~text
29c8707 chore: registrar procedencia y resumen de evidencias tecnicas
1b5b8e6 fix: proteger la compatibilidad de fotografias historicas
c817c93 test: incorporar pruebas reproducibles y herramientas de calidad
9bd7b4c fix: aislar avances y recuperar simulacros sin redisenar las vistas
baab03a fix: proteger autenticacion, permisos y persistencia por usuario
0a9abfc chore: excluir dependencias instaladas del control de versiones
~~~

El commit posterior de documentación/evidencias se consulta con git log; no se intenta incluir su propio hash recursivamente en este archivo.

## 10. Intervención del equipo

Proveer entorno SQL de pruebas/esquema, revisar migración/respaldos, configurar secretos, entregar recursos
faltantes, ejecutar herramientas externas, validar despliegue y organizar aceptación humana.
La revisión automática bloqueó borrar .qa-private/chrome-trace.zip y edge-trace.zip; retirarlos manualmente.
Solo contienen actividad ficticia y pueden incluir cookies de esa sesión temporal; están ignorados y fuera de la entrega.

## 11. Preparación académica

Es posible documentar fielmente la implementación y los resultados locales. No corresponde afirmar validación
integral de servicios remotos o producción. pendientes-documentacion.md detalla el estado de cada parte
de la plantilla y los inventarios para estimación sin inventar esfuerzo, productividad, duración ni costos.
