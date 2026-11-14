# Información preparada para la plantilla académica

No se reescribió el documento final de Ingeniería de Software II. Este directorio es un expediente
técnico para elaborarlo después de validar pendientes con el equipo y la docente.

| Parte de la plantilla | Insumo real preparado | Qué falta |
|---|---|---|
| Requisitos y casos de uso | Inventario RF01–RF24, actores estudiante/profesor y cinco hilos CU | Revisar numeración y texto contra la plantilla/documento previo no adjunto |
| Arquitectura y componentes | createApp, middlewares, controladores y módulos JS identificados | Cotejar despliegue definitivo y sus límites |
| Clases/UML | Cero clases propias declaradas; módulos funcionales y entidades conceptuales identificadas | No aplicar WMC/DIT/CBO/LCOM como si fueran métricas de clases implementadas |
| Secuencias | Cinco diagramas fieles a rutas y funciones actuales | Revisión académica de notación y correspondencia de IDs |
| Entidad-relación | Migraciones nuevas y compatibilidad; diagrama SQL | Exportar y cotejar esquema Supabase real |
| Pruebas unitarias | Equivalencias, límites, grafos, complejidades AST, tests y cobertura | Incorporar reportes reales finales sin reutilizar la ejecución histórica |
| Integración | Ascendente/descendente y cinco hilos ejecutados localmente | Validar pg de red/TLS, Supabase y OpenRouter reales en entorno autorizado |
| Sistema/calidad | Microprueba, controles negativos, salud, JMX y plan ZAP | Ejecutar JMeter/ZAP/Sonar, usuarios reales, más navegadores y observación histórica |
| Aceptación | CA01–CA05 automatizados con capturas | Aceptación formal de usuarios y docente |
| Métricas | JSON/CSV por archivo, base y versión corregida, criterios reproducibles | Nueva corrida SonarQube y conciliación de definiciones |
| Estimación | Frontera, inventario de entradas/salidas, entidades y tareas | Decisiones y datos del equipo: pesos, complejidad, productividad, esfuerzo y costos |

## Inventario para estimación, sin pesos inventados

Frontera de aplicación: navegador + API PrepICFES; PostgreSQL es persistencia administrada por la
aplicación. OpenRouter y enlaces Drive son interfaces externas. Cuentas/roles son usuarios finales.

- Entradas candidatas: registro, login/logout, ejercicio/estado de progreso, configuración y entrega
  de simulacro, clase, inscripción/retiro, anuncio y actualización multipart del perfil.
- Salidas/consultas candidatas: paneles, progreso por área/general, grupo y estadísticas, búsqueda
  de estudiante, anuncios, perfil/fotografía y resultados/revisión del simulacro.
- Archivos lógicos candidatos: usuarios, clases, inscripciones, progreso por área, sesiones y
  resultados. `progreso_estudiante` es compatibilidad y no debe contarse automáticamente como
  un archivo lógico independiente del mismo progreso.
- Interfaces externas candidatas: servicio OpenRouter y recursos educativos suministrados por enlaces.
- Objetos de interfaz observados:20 páginas HTML, modales existentes y un componente JSX no
  integrado. La cantidad de páginas no equivale directamente a puntos de objetos.
- Casos/historias candidatas: RF01–RF24. El equipo debe separar historias, fijar criterios de aceptación,
  identificar actores simples/medios/complejos y estimar sus transacciones según el método elegido.

Puntos de función: decidir método/versión, DET/FTR/RET y frontera antes de aplicar pesos.
Puntos de casos de uso: clasificar actores/casos y acordar factores técnicos/ambientales.
Puntos de objetos: clasificar pantallas/reportes/componentes reutilizados y complejidad.
Puntos de historias: sesión de estimación del equipo con escala y referencia comunes.
Estimación con herramienta: seleccionar herramienta, versión y modelo; conservar archivo de
entrada y salida. No convertir LOC a esfuerzo sin un modelo y calibración explícitos.

No se asignaron horas, semanas, velocidad, productividad, tarifas ni costos. Se requieren datos
históricos del equipo, disponibilidad, alcance acordado y criterios de complejidad.

## Intervenciones pendientes

1. Suministrar esquema exportado y un entorno Supabase de pruebas, sin exponer claves en Git.
2. Revisar la migración en una copia; resolver duplicados/huérfanos y contrastar conteos.
3. Configurar JWT_SECRET persistente, OpenRouter API key/modelo autorizado y probar proveedor real.
4. Suministrar24 ejercicios faltantes de Ciencias y14 destinos/archivos de recursos. No se inventaron respuestas ni se sustituyeron bancos.
5. Verificar permisos de los3 enlaces Drive existentes; la disponibilidad privada depende de su propietario.
6. Ejecutar herramientas externas y aceptación humana. Revisar despliegue Vercel con raíz del repo;
   el adaptador se preparó pero no se desplegó ni se validó un build remoto.
7. Retirar manualmente `.qa-private/chrome-trace.zip` y `edge-trace.zip`: la revisión automática
   bloqueó su eliminación. Son trazas de la base ficticia, pueden incluir cookies/contraseñas de
   fixtures, están ignoradas y no se entregan como evidencia ni se incluyen en commits.
