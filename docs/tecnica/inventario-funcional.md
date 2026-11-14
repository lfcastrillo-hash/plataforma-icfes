# Inventario funcional y matriz de auditoría

El comportamiento posterior se verifica con los tests indicados. Los archivos se dan relativos
a la raíz; `controllers/` y `routes/` pertenecen a `backend/`, y `js/` a `frontend/`.
Los resultados exactos y el listado completo están en `evidencias/pruebas-unitarias/resultados.json`
y `evidencias/aceptacion/resultados.json`.

| Req. | Función esperada | Situación inicial y corrección | Archivos principales | Verificación | Estado |
|---|---|---|---|---|---|
| RF01 | Registrar nombre/correo/clave/rol válidos | Formularios incompatibles, sin validación/hash; ahora validados, correo normalizado y único | auth.controller, auth.routes, js/auth | IT01, M1-CE/VL | Verificado local |
| RF02 / CU02 | Iniciar sesión solo con credenciales y rol correctos | Comparación SQL de texto plano; ahora hash y cookie HttpOnly | auth.controller, verificarToken | IT01, CA01 | Verificado local |
| RF03 | Cerrar sesión e invalidar acceso anterior | Solo borraba cookie; ahora revoca jti en SQL | auth.controller, js/prep y paneles | IT08, CA05 | Verificado local |
| RF04 | Separar permisos profesor/estudiante | Bastaba un JWT para operaciones docentes; ahora rol consultado en SQL | middlewares/access, clases.routes | IT03/IT04 | Verificado local |
| RF05 | Panel estudiante con saludo/progreso propios | Progreso por correo sin protección; ahora ID y promedio de cinco áreas | panel-estudiante.js, progresoAreas.controller | IT02, CA01/CA02 | Verificado local |
| RF06 / CU03 | Consultar contenido de cinco módulos | Contenido conservado byte a byte en markup; lógica compartida | modulo-*.html, js/aprendizaje | integridad-estatica, CA02 | Contenido existente verificado |
| RF07 | Evaluar ejercicios sin duplicar avance | Aciertos locales globales; ahora claves por ejercicio/usuario y fusión transaccional | aprendizaje.js, lib/progress | M2-CB, IT02, CA02 | Verificado con límite académico de Ciencias |
| RF08 | Recuperar progreso al recargar o volver a entrar | Detalle de respuestas solo en navegador; ahora JSONB y recuperación SQL | progresoAreas.controller, aprendizaje.js | IT02, INT-ASC reinicio, CA02 | Verificado local |
| RF09 / CU05 | Elegir modalidad general/área/temas | Configuración inválida provocaba errores; ahora validación y deduplicación de temas | simulacro-selector, simulacro-nuevo, simulacro-core | M3-CB, CA03, CA03-extra | Verificado local |
| RF10 | Navegar, omitir, temporizar y finalizar simulacro | Saltos en feedback, doble finalización y reinicio al recargar; ahora guardas y recuperación del intento | simulacro-nuevo | M3, CA03 | Verificado local |
| RF11 | Calcular, revisar y conservar resultados reproducibles | Mínimo arbitrario 100 y mezcla con aprendizaje; ahora práctica 0–500, recálculo en API y UUID idempotente | simulacro-core, simulacros.routes | CU05 integración, CA03 | Verificado local; no calificación oficial ICFES |
| RF12 | Consultar cuadernillos y recursos existentes | Hay archivos/enlaces que no se suministraron | cuadernillos, entrenando, filtros, mas-material, clases_grabadas | inventario estático de enlaces | Parcial; requiere archivos/URLs |
| RF13 / CU11 | Crear y listar clases propias | Se confiaba en correo enviado; ahora ID de sesión | clases.controller, panel-profesor | IT03, CA04 | Verificado local |
| RF14 | Eliminar clase con sus inscripciones | Sin propietario/transacción; ahora ambos controles y COMMIT antes de éxito | clases.controller, lib/transaction | IT03, IT09 | Verificado local |
| RF15 | Inscribir/retirar estudiantes por correo | Sin propiedad y carrera de duplicados; ahora bloqueo, rol estudiante y unicidad SQL | clases.controller, esquema | IT04, IT09, CA04 | Verificado local |
| RF16 | Consultar grupo y progreso coherente | Promedio solo de áreas existentes inflaba progreso; ahora suma/5 | clases.controller, panel-profesor | IT04 | Verificado local |
| RF17 | Buscar estudiantes y ver sus clases con el profesor | Búsqueda arbitraria y profesor suministrado; ahora búsqueda parcial dentro de grupos propios o correo exacto para inscribir | buscarEstudiante, panel-profesor | IT04 | Verificado local |
| RF18 | Publicar/leer anuncios de las clases correspondientes | Escritura ajena posible y lectura sin ruta; ahora propietario/inscripción y texto seguro | clases.controller, panel-estudiante | IT05, CA04 | Verificado local |
| RF19 / CU08 | Consultar/editar perfil propio y correo único | Parámetro ignorado, campos sin validación; ahora identidad y transacción | perfil.controller, perfil-*.js | IT06, CA05 | Verificado local |
| RF20 | Cambiar clave sin almacenarla en claro | Guardaba texto; ahora hash e invalidación de otras sesiones | perfil.controller, passwords | IT08 | Verificado local |
| RF21 | Guardar biografía/foto y persistirlas | XSS y disco efímero; ahora texto escapado y bytes en BD | perfil.controller, perfil.routes, perfil-*.js | IT07, CA05 | Foto HTTP/BD verificada; despliegue pendiente |
| RF22 | Tutor IA con errores claros y secretos solo en servidor | Impedía iniciar sin clave, errores del proveedor expuestos | ia.controller, ia.routes, chat-ia.js | INT-DESC stub, SEC /chat | Fallos verificados; proveedor real pendiente |
| RF23 | Persistencia e integridad por usuario estable | Sin migraciones, identidad por correo | migrations, db, lib/transaction | DB-MIG, INT-ASC | SQL WASM verificado; Supabase pendiente |
| RF24 | Conservar apariencia y material académico | Sin protección contra regresiones | qa/static, qa/visual | 30 verificaciones estáticas + 20 comparaciones PNG | Verificado; texto de escalas corregido explícitamente |

El progreso de aprendizaje es un mecanismo de práctica: el navegador comunica ejercicios completados.
La API valida su forma, usuario, rango y duplicados; no es un sistema antifraude de examen supervisado.
Las respuestas de simulacro sí se recalculan en servidor desde el banco compartido. La API de resultados
acepta subconjuntos válidos de preguntas para prácticas; no certifica una selección oficial ni un examen completo.

No se eliminó el código histórico `perfil.js`, `progreso.js`, `simulacro.js` o `ChatIA.jsx`;
se identificó que ninguna pantalla actual carga esos auxiliares, salvo los activos expresamente indicados.
