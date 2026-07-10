# Propuesta: Reflejar el loop de aprobación de cotizaciones (BC03 Épica 2) en el frontend

El backend cambió la semántica de **enviar una cotización**: ya no pasa directo a `ENVIADA`, ahora
abre una **solicitud de aprobación** y la cotización queda en `PENDIENTE_APROBACION` hasta que
alguien la apruebe, rechace u observe. El frontend todavía asume el contrato viejo (envío directo,
`204`) y no conoce ese estado ni ese loop. Esta propuesta alinea el front con la API real y agrega
la feature de aprobaciones de punta a punta.

> Contrato fuente: `bc03-gestion-comercial/docs/api/API-Aprobaciones.md`.
> Detalle de gap, patrones a reusar y estructura del slice: ver `exploration.md` (no se duplica acá).

## Título y contexto — qué problema resuelve

Hoy la cotización tenía un único camino de salida del borrador: `enviar` → `ENVIADA`. El backend
introdujo un paso intermedio obligatorio de aprobación (quórum = 1):

```
BORRADOR / EN_REVISION ──enviar──▶ PENDIENTE_APROBACION ──┬─ aprobar  ▶ ENVIADA
                                                          ├─ rechazar ▶ BORRADOR
                                                          └─ observar ▶ BORRADOR
```

El front quedó desalineado en dos frentes: (1) la acción `enviar` que ya existe habla un contrato
que el backend ya no cumple, y (2) no existe ninguna superficie para operar el loop nuevo (bandeja,
resolución, historial, estado, KPI).

## Por qué ahora / motivación

- **El front está roto contra la API real.** `enviarCotizacion` asume `204 No Content`; el backend
  responde `201 { id }` y deja la cotización en `PENDIENTE_APROBACION`, un estado que el front no
  modela. El copy de la acción ("Cotización enviada", "quedará enviada") ahora **miente**.
- **Bug visual silencioso ya presente.** El `Pipeline()` del detalle no contempla
  `PENDIENTE_APROBACION`: al llegar una cotización en ese estado, el pipeline no resalta ningún paso.
- **El backend ya expone el KPI** `pendientesAprobacion` en `/cotizaciones/resumen`; el front lo
  ignora. La desalineación es unilateral: falta trabajo del lado del frontend, no del backend.

## Objetivos / resultado esperado

Que el loop de aprobación sea **operable de punta a punta desde el front**:

- Solicitar aprobación desde el detalle de la cotización, con copy honesto.
- Un aprobador ve la bandeja de solicitudes pendientes y puede aprobar / rechazar / observar.
- La cotización refleja correctamente el estado `PENDIENTE_APROBACION` (badge, acciones, pipeline).
- La traza de aprobaciones es visible en el detalle de cada cotización.
- El KPI de pendientes de aprobación aparece junto al resto de KPIs de cotizaciones.

## Alcance (in-scope)

Dos grupos de trabajo.

### A. Retoques al slice existente `cotizaciones`

| # | Ítem | Qué cambia |
|---|------|-----------|
| A1 | `enviar` | Contrato `204` → `201 { id }`; copy de la acción pasa a **"Solicitar aprobación"**; la cotización aterriza en `PENDIENTE_APROBACION`. |
| A2 | Estado | Nuevo valor `PENDIENTE_APROBACION` en `EstadoCotizacion`. |
| A3 | Badge | Nuevo case en el badge de estado (etiqueta "Pendiente de aprobación"). |
| A4 | `accionesPermitidas` | Nuevo case: sin editar ni reenviar mientras está `PENDIENTE_APROBACION`. |
| A5 | Pipeline | Corregir `Pipeline()` del detalle para contemplar el estado nuevo (bug visual). |
| A6 | KPIs | Nuevo bucket `pendientesAprobacion` en `BucketCotizacion` / `ResumenCotizaciones` y 5.ª tarjeta en la grilla de KPIs. |

### B. Slice nuevo `aprobaciones`

Vertical slice bajo `src/modulos/comercial/aprobaciones/`, espejando el layout feature-first de
`cotizaciones`.

| # | Ítem | Qué incluye |
|---|------|-------------|
| B1 | Servicios | Funciones API para aprobar, rechazar, observar, listar pendientes y obtener historial. |
| B2 | Hooks | Consultas (bandeja, historial) y mutaciones (aprobar/rechazar/observar) sobre `useConsulta`/`useMutar`. |
| B3 | Bandeja | Vista de solicitudes pendientes (`GET /aprobaciones/pendientes`) con tabla paginada. |
| B4 | Modales de resolución | Diálogos aprobar / rechazar / observar, con validación zod (`motivo`/`comentario` con longitud mínima ≥ 1). |
| B5 | Historial | Feed de solicitudes (`GET /cotizaciones/:id/aprobaciones`) embebido en el detalle de la cotización. |
| B6 | Ruta + sidebar | Ruta propia `/comercial/aprobaciones` con ítem lateral **"Aprobación de cotizaciones"**. |

## Fuera de alcance (non-goals)

- **Gating de permisos client-side.** Las acciones de resolución son visibles para todos los
  usuarios (MVP: el backend aún no exige `bc03:aprobacion:resolver`).
- **Activar `JwtAuthGuard`** o cualquier cambio de autenticación/autorización.
- **Tests automatizados** (el proyecto no tiene runner configurado — gate = build + lint + verify).
- **Cualquier cambio en el backend.** El contrato es fuente de verdad y se toma como dado.
- **Reglas de negocio propias sobre `motivo`/`comentario`** más allá de "no vacío".

## Enfoque de alto nivel

- **Reusar la infraestructura existente**, no crear nada transversal nuevo: cliente HTTP
  `clienteComercial`, proxy catch-all `/api/comercial/[[...path]]`, hooks `useConsulta`/`useMutar`,
  `TablaDatos`, patrón de diálogos zod y patrón de badge de estado.
- **No tocar el proxy.** El catch-all ya reenvía `/aprobaciones/*` y `/cotizaciones/:id/aprobaciones`
  al backend inyectando el bearer server-side — funciona sin cambios.
- **Espejar la convención de `cotizaciones`** en el slice nuevo (misma estructura de carpetas, mismo
  estilo de servicios documentados por contrato, mismas claves de invalidación
  `comercial/<recurso>`).
- **Aprovechar el compilador como red de seguridad.** Los `switch` exhaustivos sobre
  `EstadoCotizacion` (badge, `accionesPermitidas`) fallarán en build al agregar el valor nuevo,
  guiando exactamente dónde falta el case.

## Impacto y riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| **Cambio de semántica de una acción en uso (`enviar`)** | Usuarios que hoy "envían" ahora solo *solicitan* aprobación; expectativa distinta. | Copy honesto ("Solicitar aprobación") + estado y badge que comunican el nuevo paso. |
| **Invalidación multi-clave tras resolver** | Al aprobar/rechazar/observar cambian a la vez la bandeja, la cotización y los KPIs; olvidar una clave deja UI stale. | Invalidar en bloque las claves afectadas (bandeja, cotizaciones, resumen, detalle) — se define en spec/design. |
| **409 de carrera** | Dos resoluciones concurrentes: la segunda recibe `409`. | Branch de manejo de error específico + refetch de la bandeja para que la fila desaparezca. |
| **Bug del `Pipeline()`** | Estado nuevo sin paso resaltado en el detalle. | Corrección explícita como ítem A5. |
| **Colisión de nombres en el sidebar** | Ya existe un ítem "Aprobaciones" (viáticos, `href="#"`). | Label específico "Aprobación de cotizaciones". |

### Plan de rollback

El cambio es **aditivo** salvo la semántica de `enviar`. Para revertir:

- **A1 (`enviar`)** es el único cambio no aditivo: revertir el tipo de retorno a `Promise<void>` y el
  copy a "Enviar cotización" restaura el comportamiento anterior del front. **Nota:** esto solo
  aplica si el backend también revirtiera; contra el backend actual el contrato viejo ya no
  funciona, por lo que el rollback real de `enviar` está acoplado al backend.
- **Slice `aprobaciones` (B1–B6)** es puramente aditivo: quitar la ruta, el ítem del sidebar y la
  carpeta del slice lo elimina sin afectar a `cotizaciones`.
- **A2–A6** son extensiones de tipos y UI: revertibles quitando el valor de enum y sus cases
  asociados (el compilador vuelve a marcar los `switch` exhaustivos, guiando la reversión).

## Preguntas abiertas para diseño

1. **Ubicación de `enviarCotizacion`** — ¿se queda en `cotizaciones-api.ts` (la ruta sigue siendo
   `/cotizaciones/:id/enviar`) o se mueve al slice `aprobaciones` por dueño de dominio? Se zanja en
   sdd-design.
2. **Orden del historial** — el backend entrega cronológico; ¿mostrar más reciente primero?
3. **Breakpoint de la grilla de KPIs** con 5 tarjetas — ¿`sm:grid-cols-5` o dejar la 5.ª en fila
   propia?
4. **Superficie de las acciones de resolución** — ¿exponerlas también en el detalle de la cotización
   cuando está `PENDIENTE_APROBACION`, o solo desde la bandeja?

## Siguiente paso

`sdd-spec` y `sdd-design` pueden correr en paralelo a partir de esta propuesta.
