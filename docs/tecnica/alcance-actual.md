# Alcance técnico vigente de PrepICFES

## Cierre académico del 15/11/2026

Resumen definitivo: [cierre-academico.md](cierre-academico.md). El alcance comprometido es:
registro y sesión, roles estudiante/profesor, cinco módulos con 200 ejercicios, simulacros
con resultados, seguimiento del progreso, clases y gestión de estudiantes, perfil y
persistencia PostgreSQL. Está probado localmente; no equivale a aceptación docente ni
a despliegue remoto verificado.

Los recursos secundarios no suministrados quedan fuera de lo comprometido: ocho sesiones PDF,
dos grabaciones y tres Drive no acreditados se presentan sin enlace activo. Más Material
ofrece tres cuadernillos oficiales y el catálogo ICFES, comprobados por GET real.
No se modifican CSS ni estructura visual. Los reportes históricos conservan sus resultados;
las pruebas del cierre están en `evidencias/cierre-academico-20261115/`.

## Decisión histórica y exclusión de IA

Base histórica: versión 1.1.0, commit 785be5edc3ee70bcc9f03b0c7387d9823874af23.
Decisión del equipo y la profesora, recibida el 14/11/2026: el asistente de IA de OpenRouter
queda excluido del producto y de la futura documentación de Ingeniería de Software II.
Este registro técnico sustituye únicamente las referencias de alcance vigentes al asistente.
No reescribe el documento académico final ni altera informes o evidencias históricas.

## Integración retirada

- Backend: antiguo cliente OpenAI dirigido a OpenRouter, controlador ia.controller.js y router ia.routes.js.
- Dependencia exclusiva: openai, eliminada de backend/package.json y su lockfile.
- Configuración retirada: OPENROUTER_API_KEY y OPENROUTER_MODEL del ejemplo y del comprobador de entorno.
- Frontend: chat-ia.js y el componente JSX no importado ChatIA.jsx.
- Ruta antigua POST /api/chat: responde 410, sin proveedor, credenciales ni llamadas de red.
- El parámetro de pruebas aiClient deja de formar parte de createApp.
- Pruebas antiguas del proveedor stub: se sustituyen por comprobaciones de exclusión.

Los únicos elementos visibles retirados son los 13 botones flotantes IA/✨, con autorización
explícita del usuario: panel y perfil del estudiante, Áreas, cinco módulos, Cuadernillos,
Entrenando, Filtros, Más material y Clases grabadas. No se modifican CSS, colores, tamaños,
logotipos, distribución ni contenido académico. Las reglas CSS históricas del chat se conservan
sin uso para respetar la prohibición de editar CSS.

No se requiere contratar, configurar ni probar OpenRouter para cerrar el alcance académico.
Las menciones en auditorías, informes y evidencias de 1.1.0 describen el pasado y no deben
interpretarse como requisitos vigentes. El generador histórico scripts/qa/summarize.cjs pertenece
a esa entrega; no debe usarse para sobrescribir este alcance ni para regenerar el documento final.

## Protección de evidencias

evidencias/verificacion-final queda sin seguimiento y no se agrega a commits automáticamente.
Todos los archivos previos de evidencias se inventariaron por SHA-256 antes de editar fuentes.
Las comprobaciones nuevas se guardan en evidencias/estabilizacion-seguridad-20261114, por fase,
identificando el commit base y las modificaciones locales todavía sin commit.
