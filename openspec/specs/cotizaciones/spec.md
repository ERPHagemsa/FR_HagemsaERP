# Delta for Cotizaciones

## ADDED Requirements

### Requirement: Estado PENDIENTE_APROBACION en el modelo de estados

El front DEBE modelar `PENDIENTE_APROBACION` como valor válido de `EstadoCotizacion`, con badge propio
("Pendiente de aprobación") y `accionesPermitidas` sin editar, reenviar, ganar, perder ni cancelar
mientras la cotización esté en ese estado.

#### Scenario: Badge de una cotización pendiente de aprobación

- GIVEN una cotización con `estado = PENDIENTE_APROBACION`
- WHEN se renderiza su badge de estado
- THEN el badge DEBE mostrar la etiqueta "Pendiente de aprobación"

#### Scenario: Acciones bloqueadas mientras espera aprobación

- GIVEN una cotización con `estado = PENDIENTE_APROBACION`
- WHEN el front calcula `accionesPermitidas()`
- THEN editar, reenviar, marcar ganada, marcar perdida y cancelar DEBEN resolver en `false`

### Requirement: Pipeline del detalle contempla PENDIENTE_APROBACION

El `Pipeline()` del detalle de cotización DEBE resaltar un paso propio cuando `estado =
PENDIENTE_APROBACION`, en vez de dejar `indiceActual = -1` (bug visual actual).

#### Scenario: Pipeline resalta el paso de aprobación

- GIVEN una cotización con `estado = PENDIENTE_APROBACION`
- WHEN se renderiza el pipeline del detalle
- THEN DEBE resaltarse el paso correspondiente a la solicitud de aprobación, no un pipeline sin paso activo

### Requirement: KPI de pendientes de aprobación

La grilla de KPIs de cotizaciones DEBE mostrar una tarjeta `pendientesAprobacion` con el valor
que entrega `/cotizaciones/resumen`. El front NO DEBE recalcular ese número — solo mostrarlo.

#### Scenario: Tarjeta de KPI muestra el valor del backend

- GIVEN que `GET /cotizaciones/resumen` responde `pendientesAprobacion: 4`
- WHEN se renderiza la grilla de KPIs
- THEN DEBE mostrarse una tarjeta con el valor `4` sin transformación adicional

#### Scenario: Bucket navegable como el resto de KPIs

- GIVEN que el usuario hace click en la tarjeta `pendientesAprobacion`
- WHEN se navega al listado filtrado
- THEN el listado DEBE aplicar el bucket `pendientesAprobacion` igual que los demás buckets existentes

### Requirement: Historial de aprobaciones en el detalle de la cotización

El detalle de la cotización DEBE incluir una sección con el historial de solicitudes de aprobación
de esa cotización, obtenido de `GET /cotizaciones/:id/aprobaciones`.

#### Scenario: Historial visible en el detalle

- GIVEN una cotización que ya tuvo al menos una solicitud de aprobación
- WHEN se abre su vista de detalle
- THEN DEBE mostrarse la sección de historial con cada solicitud y su estado (`EN_APROBACION`,
  `APROBADA`, `RECHAZADA`, `OBSERVADA`) en el orden entregado por el backend

#### Scenario: Cotización sin solicitudes previas

- GIVEN una cotización que nunca solicitó aprobación
- WHEN se abre su vista de detalle
- THEN la sección de historial DEBE mostrar un estado vacío, sin error

## MODIFIED Requirements

### Requirement: Solicitar aprobación de una cotización

(Previously: la acción se llamaba "Enviar cotización" y asumía `204 No Content` con transición
directa `BORRADOR → ENVIADA`.)

El front DEBE ofrecer la acción "Solicitar aprobación" sobre una cotización en `BORRADOR` o
`EN_REVISION`, invocando `POST /cotizaciones/:id/enviar`. La función wrapper
(`solicitarAprobacion`) DEBE vivir en `cotizaciones-api.ts`. El front DEBE interpretar `201 { id }`
como éxito (el `id` es de la solicitud de aprobación, no de la cotización) y llevar la cotización a
`PENDIENTE_APROBACION`. El front NO DEBE mostrar copy que implique envío directo o congelamiento
inmediato de versión.

#### Scenario: Solicitud de aprobación exitosa

- GIVEN una cotización en `BORRADOR` con al menos una línea
- WHEN el ejecutivo confirma "Solicitar aprobación"
- THEN el front DEBE recibir `201 { id }`
- AND la cotización DEBE reflejar `estado = PENDIENTE_APROBACION`
- AND el copy de éxito DEBE indicar que se solicitó aprobación, no que se envió

#### Scenario: Ya existe una solicitud vigente (409)

- GIVEN una cotización que ya tiene una solicitud `EN_APROBACION`
- WHEN se intenta solicitar aprobación nuevamente
- THEN el backend responde `409`
- AND el front DEBE mostrar un mensaje inline indicando que ya hay una solicitud vigente, sin reintentar automáticamente

#### Scenario: Cotización sin líneas o en estado inválido (422)

- GIVEN una cotización sin líneas cargadas, o en un estado que no permite enviar
- WHEN se intenta solicitar aprobación
- THEN el backend responde `422`
- AND el front DEBE mostrar el mensaje de error verbatim del backend

#### Scenario: Cotización inexistente (404)

- GIVEN un id de cotización que no existe
- WHEN se intenta solicitar aprobación
- THEN el backend responde `404`
- AND el front DEBE mostrar un mensaje de error genérico de "no encontrada"

#### Scenario: Payload inválido (400)

- GIVEN un `validezDias` no numérico o menor a 1
- WHEN se intenta solicitar aprobación con ese valor
- THEN el backend responde `400`
- AND el front DEBE mostrar el error de validación sin enviar la solicitud
