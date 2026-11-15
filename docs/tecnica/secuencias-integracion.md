# Secuencias de los hilos ejecutados

Estos participantes corresponden a módulos/funciones reales. Los nombres CU02/CU03/CU05/CU11/CU08
siguen la misión recibida; no se inventaron actores o clases del código.

## CU02: sesión

```mermaid
sequenceDiagram
 actor U as Usuario
 participant F as auth.js
 participant A as POST /api/login
 participant C as auth.controller.login
 participant D as PostgreSQL
 participant K as passwords + JWT
 U->>F: Correo, clave y rol
 F->>A: JSON
 A->>C: Entrada validada
 C->>D: SELECT usuario por correo normalizado y rol
 C->>K: verifyPassword
 alt Credenciales válidas
 C->>D: BEGIN, sesión SQL y COMMIT
 C->>K: Firmar id_usuario + jti
 C-->>F: Cookie HttpOnly + metadatos
 F->>F: Guardar ID/nombre/correo y abrir panel
 else Credenciales inválidas
 C-->>F: 400 o 401 con mensaje
 end
```

## CU03: aprendizaje

```mermaid
sequenceDiagram
 actor E as Estudiante
 participant F as aprendizaje.js
 participant P as Prep + caché por ID
 participant A as POST /api/progreso-area
 participant M as verificarToken + access
 participant C as progresoAreas + saveArea
 participant D as PostgreSQL
 E->>F: Seleccionar opción
 F->>F: Evaluar handler conservado y evitar duplicado
 F->>P: Guardar acierto por clave de ejercicio
 P->>A: Estado y porcentaje
 A->>M: Validar JWT, sesión SQL, rol e identidad de pestaña
 M->>D: Consultar sesión y usuario
 M->>C: Usuario por ID
 C->>C: Validar área, rango y estado
 C->>D: BEGIN, bloquear usuario, leer estado y fusionar
 C->>D: UPSERT por ID/área, COMMIT
 C-->>P: success
 E->>F: Recargar o iniciar otra sesión
 F->>A: GET progreso-areas de cuenta actual
 A->>D: Estado JSONB por ID
 D-->>F: Restaurar aciertos y temas conocidos
```

Si falla la red, el estado local se conserva y se vuelve a intentar al abrir el módulo.
Los porcentajes antiguos sin detalle se muestran como mínimo histórico; no se inventa qué
ejercicio había contestado la persona. Ciencias no puede completar tres temas sin sus ejercicios.

## CU05: simulacro

```mermaid
sequenceDiagram
 actor E as Estudiante
 participant S as Selector
 participant F as simulacro-nuevo
 participant B as Banco + SimulacroCore
 participant A as POST /api/simulacros
 participant D as PostgreSQL
 E->>S: Modalidad, área o temas
 S->>F: sessionStorage simulacro_config
 F->>B: Validar selección y construir preguntas
 E->>F: Responder/omitir/finalizar
 F->>B: Calcular práctica local reproducible
 F->>A: UUID, IDs de preguntas y opciones elegidas
 A->>A: Autenticar y validar usuario/IDs/duplicados
 A->>B: Recalcular con el banco del servidor
 A->>D: INSERT idempotente, independiente de aprendizaje
 A-->>F: Resultado persistido
 F-->>E: Puntaje de práctica y revisión
```

El resultado queda también en `ultimo_simulacro` del espacio por usuario. Si falla la API se
marca pendiente; no se afirma que esté persistido en servidor. Reenviar el mismo UUID es seguro.

## CU11: clases

```mermaid
sequenceDiagram
 actor P as Profesor
 participant F as panel-profesor.js
 participant A as API clases/inscripciones
 participant M as JWT + rol + ownClass
 participant D as PostgreSQL
 P->>F: Crear clase
 F->>A: POST nombre_clase
 A->>M: Sesión y rol profesor
 A->>D: INSERT con id_profesor de sesión y código aleatorio
 D-->>F: Clase creada
 P->>F: Agregar estudiante por correo
 F->>A: POST email e id_clase
 A->>M: Propiedad de clase
 A->>D: BEGIN y SELECT FOR UPDATE
 A->>D: Resolver estudiante e INSERT único
 A->>D: COMMIT
 A-->>F: Éxito o duplicado
```

La eliminación sigue el mismo control de propietario y ejecuta borrado de inscripciones y
clase en una transacción. Un profesor ajeno obtiene404 y no altera filas.

## CU08: perfil

```mermaid
sequenceDiagram
 actor U as Usuario
 participant F as perfil-estudiante o perfil-profesor
 participant A as POST perfil/actualizar
 participant V as JWT + Multer + validación
 participant C as perfil.controller
 participant D as PostgreSQL
 U->>F: Nombre/correo/bio/clave/foto
 F->>A: FormData
 A->>V: Sesión, máximo 2 MiB y firma de imagen
 V->>C: Datos del usuario autenticado
 C->>D: BEGIN y SELECT por ID FOR UPDATE
 C->>D: UPDATE perfil y bytes de foto opcionales
 opt Cambio de contraseña
 C->>C: scrypt con sal
 C->>D: Guardar hash y revocar otras sesiones
 end
 C->>D: Actualizar correos auxiliares de progreso
 C->>D: COMMIT
 C-->>F: Datos persistidos
 F->>F: Actualizar metadatos y recargar
```

## Valores y estados de los hilos

| Hilo | Precondición/entrada | Estado esperado | Negativo comprobado |
|---|---|---|---|
| CU02 | Usuario QA, clave fixture y rol coincidente | Sesión SQL + cookie; panel del rol | clave/rol incorrectos, token expirado |
| CU03 | Estudiante A, 8 ejercicios del tema0 | 20 % Matemáticas, 4 % global; tema recuperable | B no recibe avance; repetir no incrementa |
| CU05 | Área Inglés y respuestas/omisiones | suma de estados = preguntas; puntaje cliente = servidor | pregunta repetida/desconocida e ID de resultado ajeno |
| CU11 | Profesor P y estudiante registrado | clase de P, inscripción única y anuncio visible | P2 no puede ver/editar/eliminar clase de P |
| CU08 | Cuenta autenticada y correo nuevo único | mismo ID, mismas clases y progreso | correo duplicado revierte toda modificación |

La evidencia concreta de cada ejecución está enlazada desde `trazabilidad-pruebas.md` y los reportes.
