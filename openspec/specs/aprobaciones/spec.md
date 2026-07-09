# Delta for Aprobaciones

## ADDED Requirements

### Requirement: Bandeja de solicitudes pendientes

El front DEBE ofrecer una bandeja que lista las solicitudes de aprobación `EN_APROBACION`, consumiendo
`GET /aprobaciones/pendientes` de forma paginada. Cada fila DEBE mostrar `idCotizacion`,
`numeroVersion`, `validezDias`, `fechaCreacion`, `usuarioCreacion`, el par `numeroCotizacion`/
`anioCotizacion` (o "sin numerar" cuando sean `null`) y `nombreEjecutivoResponsable`. Cada fila DEBE
permitir navegar al detalle de la cotización asociada.

#### Scenario: Bandeja con solicitudes pendientes

- GIVEN que existen solicitudes `EN_APROBACION`
- WHEN el usuario abre la bandeja de aprobaciones
- THEN DEBE listarse cada solicitud con sus campos y paginación server-side

#### Scenario: Cotización aún sin numerar

- GIVEN una solicitud cuya cotización nunca fue aprobada antes
- WHEN se renderiza su fila en la bandeja
- THEN DEBE mostrarse "sin numerar" en lugar de un número vacío o `null`

#### Scenario: Navegar al detalle desde la bandeja

- GIVEN una fila de la bandeja
- WHEN el usuario selecciona esa fila
- THEN el front DEBE navegar al detalle de la cotización (`idCotizacion`)

### Requirement: Aprobar una solicitud

El front DEBE permitir aprobar una solicitud `EN_APROBACION` vía `POST /aprobaciones/:id/aprobar`,
con `comentario` opcional. Tras un `204` exitoso, el front DEBE refrescar la bandeja, la cotización
y los KPIs.

#### Scenario: Aprobación exitosa

- GIVEN una solicitud `EN_APROBACION`
- WHEN el aprobador confirma "Aprobar" (con o sin comentario)
- THEN el backend responde `204`
- AND la bandeja, la cotización y los KPIs DEBEN refrescarse

### Requirement: Rechazar una solicitud

El front DEBE permitir rechazar una solicitud `EN_APROBACION` vía `POST /aprobaciones/:id/rechazar`,
exigiendo `motivo` no vacío (validación zod, longitud mínima ≥ 1) antes de enviar la petición.

#### Scenario: Rechazo exitoso

- GIVEN una solicitud `EN_APROBACION`
- WHEN el aprobador ingresa un `motivo` no vacío y confirma "Rechazar"
- THEN el backend responde `204`
- AND la cotización asociada DEBE reflejar `estado = BORRADOR` tras refrescar

#### Scenario: Motivo vacío bloqueado en cliente

- GIVEN el diálogo de rechazo abierto
- WHEN el aprobador intenta confirmar sin escribir un `motivo`
- THEN el front DEBE bloquear el envío y mostrar el error de validación inline, sin llamar al backend

### Requirement: Observar una solicitud

El front DEBE permitir observar una solicitud `EN_APROBACION` vía `POST /aprobaciones/:id/observar`,
exigiendo `comentario` no vacío (validación zod, longitud mínima ≥ 1) antes de enviar la petición.

#### Scenario: Observación exitosa

- GIVEN una solicitud `EN_APROBACION`
- WHEN el aprobador ingresa un `comentario` no vacío y confirma "Observar"
- THEN el backend responde `204`
- AND la cotización asociada DEBE reflejar `estado = BORRADOR` tras refrescar

#### Scenario: Comentario vacío bloqueado en cliente

- GIVEN el diálogo de observación abierto
- WHEN el aprobador intenta confirmar sin escribir un `comentario`
- THEN el front DEBE bloquear el envío y mostrar el error de validación inline, sin llamar al backend

### Requirement: Conflicto de concurrencia al resolver (409)

Cuando dos resoluciones concurrentes apuntan a la misma solicitud, el front DEBE manejar el `409`
de la segunda resolución con un mensaje inline específico y DEBE refrescar la bandeja para que la
fila resuelta desaparezca.

#### Scenario: Solicitud ya resuelta por otra operación

- GIVEN una solicitud que otra persona ya aprobó, rechazó u observó
- WHEN el usuario actual intenta resolverla (aprobar, rechazar u observar)
- THEN el backend responde `409`
- AND el front DEBE mostrar un mensaje indicando que la solicitud ya fue resuelta
- AND la bandeja DEBE refetchear para que la fila deje de aparecer

### Requirement: Acciones de resolución también en el detalle de la cotización

Las acciones aprobar/rechazar/observar DEBEN estar disponibles tanto desde la bandeja como desde el
detalle de la cotización cuando esta tenga `estado = PENDIENTE_APROBACION`. En el MVP estas acciones
son visibles para cualquier usuario, sin gating de permisos client-side.

#### Scenario: Resolver desde el detalle de la cotización

- GIVEN una cotización con `estado = PENDIENTE_APROBACION`
- WHEN se abre su vista de detalle
- THEN DEBEN estar disponibles las acciones aprobar, rechazar y observar sobre su solicitud vigente

### Requirement: Historial de solicitudes de una cotización

El front DEBE exponer el historial de solicitudes de una cotización vía
`GET /cotizaciones/:id/aprobaciones`, mostrando cada solicitud con un badge de su `estado`
(`EN_APROBACION`, `APROBADA`, `RECHAZADA`, `OBSERVADA`) en el orden cronológico que entrega el
backend, sin reordenar.

#### Scenario: Cotización reenviada con historial múltiple

- GIVEN una cotización con más de una solicitud (una rechazada, una vigente)
- WHEN se consulta su historial
- THEN el front DEBE mostrar todas las solicitudes en el orden recibido, cada una con su badge de estado

### Requirement: Ruta y navegación de la bandeja de aprobaciones

El front DEBE exponer la bandeja en la ruta `/comercial/aprobaciones` y un ítem de sidebar con la
etiqueta "Aprobación de cotizaciones", distinguible del ítem existente "Aprobaciones" (viáticos).

#### Scenario: Acceso desde el sidebar

- GIVEN el sidebar de Gestión Comercial
- WHEN el usuario hace click en "Aprobación de cotizaciones"
- THEN el front DEBE navegar a `/comercial/aprobaciones` y renderizar la bandeja
