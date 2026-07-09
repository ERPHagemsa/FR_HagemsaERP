# Exploración: Reflejar aprobación de cotizaciones (BC03 Épica 2) en el frontend

> Cambio SDD `aprobacion-cotizacion` — fase sdd-explore. Fuente del contrato:
> `bc03-gestion-comercial/docs/api/API-Aprobaciones.md`. Store: openspec.

## 1. Contrato de la API (fuente: `API-Aprobaciones.md` del backend)

| Método | Ruta | Acción | Notas |
|---|---|---|---|
| `POST` | `/cotizaciones/:id/enviar` | Solicitar aprobación | Cambia de dueño y contrato: antes `204` directo a `ENVIADA`; ahora **`201 { id }`** (id de la `SolicitudDeAprobacion`), pasa a `PENDIENTE_APROBACION`. Body opcional `{ validezDias? }`. Errores: 400 (uuid/validezDias), 404, **409** (ya hay solicitud vigente), 422 (sin líneas / estado no permite enviar). |
| `POST` | `/aprobaciones/:id/aprobar` | Aprobar | `204`. Body opcional `{ comentario? }`. En la misma transacción congela versión, numera (solo si aún no tiene número), fija vencimiento, → `ENVIADA`. Errores 400/404/**409** (ya resuelta)/422 (no está `EN_APROBACION`). |
| `POST` | `/aprobaciones/:id/rechazar` | Rechazar | `204`. Body **requerido** `{ motivo }`. → `BORRADOR` (editable). Mismos errores + 400 si falta `motivo`. |
| `POST` | `/aprobaciones/:id/observar` | Observar | `204`. Body **requerido** `{ comentario }`. → `BORRADOR` (editable). Semánticamente distinto de rechazar pero mismo efecto sobre la cotización. |
| `GET` | `/aprobaciones/pendientes` | Bandeja | Paginado (`pagina`, `porPagina`, default 1/10). Ítem: `{ id, idCotizacion, numeroVersion, validezDias, fechaCreacion, usuarioCreacion, numeroCotizacion, anioCotizacion, nombreEjecutivoResponsable }`. Envelope `{ data, total, pagina, porPagina }` — misma forma que `RespuestaPaginadaCotizaciones`. |
| `GET` | `/cotizaciones/:id/aprobaciones` | Historial | Array pelado (sin envelope), orden cronológico. Ítem incluye `estado` (`EN_APROBACION`\|`APROBADA`\|`RECHAZADA`\|`OBSERVADA`), `comentario`, `usuarioCreacion/fechaCreacion`, `usuarioResolucion/fechaResolucion`. |

Reglas de negocio clave: quórum=1, reenviar abre solicitud **nueva** (la anterior queda terminal en el historial), numeración solo se asigna una vez, concurrencia resuelta con 409 en la segunda resolución que llega.

`GET /cotizaciones/resumen` ya documenta (`API-Cotizaciones.md` §5.2.1, actualización 2026-07-08) el nuevo KPI `pendientesAprobacion` y el bucket homónimo — **el backend ya lo expone**; el frontend es quien está desalineado.

## 2. Estado actual del front y GAP concreto

- `cotizaciones/servicios/cotizaciones-api.ts:129-134` — `enviarCotizacion` devuelve `Promise<void>` (asume 204). **Roto contra el contrato nuevo** (201 con `{ id }`).
- `cotizaciones/servicios/cotizaciones-queries.ts:153-165` — `useEnviarCotizacionMutation` invalida `CLAVE_COTIZACIONES`, `CLAVE_COTIZACIONES_RESUMEN`, `CLAVE_COTIZACION_DETALLE`. Sigue correcto (la cotización cambia de estado), pero el mensaje de éxito en `cotizacion-acciones.tsx:88` ("Cotizacion enviada correctamente") queda semánticamente mal — ahora solo *solicita* aprobación.
- `cotizaciones/tipos/cotizaciones.tipos.ts`:
  - `EstadoCotizacion` (línea 24-31): **falta `PENDIENTE_APROBACION`**.
  - `BucketCotizacion` (línea 44-48): **falta `pendientesAprobacion`** (backend ya tiene 5 buckets, front maneja 4).
  - `ResumenCotizaciones` (línea 333-339): **falta el campo `pendientesAprobacion: number`**.
  - `accionesPermitidas()` (línea 681-695): switch exhaustivo — **el compilador TS fallará al agregar el nuevo valor al enum** hasta agregar el `case` (red de seguridad útil). En `PENDIENTE_APROBACION`: sin editar ni reenviar (todo `false`), igual que los terminales, aunque no sea terminal.
- `cotizaciones/componentes/estado-cotizacion-badge.tsx` — switch exhaustivo (`variantPorEstado`, `etiquetaPorEstado`) romperá en compilación; necesita case nuevo (sugerido: variant `"outline"` con acento, etiqueta "Pendiente de aprobación").
- `cotizaciones/componentes/cotizacion-acciones.tsx:188-301` — `DialogEnviar`: copy "Enviar cotizacion" / "La cotizacion quedara enviada y la version vigente quedara congelada" — **ambos textos ahora son falsos**. Reescritura a "Solicitar aprobación".
- `cotizaciones/componentes/cotizaciones-kpis.tsx` — array `TARJETAS` (línea 40-73) tiene 4 tarjetas; falta la 5ta para `pendientesAprobacion`. Grid `grid-cols-2 sm:grid-cols-4` — con 5 tarjetas revisar breakpoint.
- `cotizaciones/vistas/cotizacion-detalle-vista.tsx` — `Pipeline()` (línea 201-248) hardcodea 3 pasos (`BORRADOR → ENVIADA → GANADA/PERDIDA`) y hace fallback a badge solo para `CANCELADA`/`VENCIDA`/`EN_REVISION`. **`PENDIENTE_APROBACION` no está contemplado**: `indiceActual = -1`, pipeline sin paso resaltado — **bug visual silencioso** a corregir explícitamente.
- No existe `aprobaciones-api.ts`, `aprobaciones-queries.ts` ni carpeta `src/modulos/comercial/aprobaciones/` — la feature no existe en el front.
- `compartido/componentes/app-sidebar.tsx` — sin entrada `/comercial/aprobaciones`. **Ojo**: ya existe un ítem *distinto* "Aprobaciones" bajo "Liquidacion de Viaticos" (línea 184, `href="#"`) — riesgo de confusión; mitigar con label específico ("Aprobación de cotizaciones").

## 3. Patrones existentes a reusar

- **Cliente HTTP / BFF**: `clienteComercial` (`compartido/api/clientes-backend.ts:73`) axios preconfigurado (`baseURL: "/api/comercial"`, cookies httpOnly, refresh single-flight). El proxy catch-all `app/api/comercial/[[...path]]/route.ts` + `crearProxyBackend` (`compartido/api/proxy-backend.ts`) ya reenvía cualquier ruta al backend inyectando el bearer server-side — **no hace falta tocar el proxy**; `/aprobaciones/*` y `/cotizaciones/:id/aprobaciones` ya funcionan.
- **Servicio API**: patrón `cotizaciones-api.ts` — funciones `async` puras que llaman `clienteComercial.get/post` y devuelven tipo tipado; comentarios de encabezado documentando el contrato (status, shape, reglas). Clonar para `aprobaciones-api.ts`.
- **Hooks de datos**: `useConsulta` (lectura, `clave` para invalidación) y `useMutar` (escritura, `onSuccess`) en `compartido/api/` — reemplazan TanStack Query; **no hay invalidación automática**, cada mutación llama `invalidarConsulta(CLAVE)` a mano.
- **Claves de invalidación**: `modulos/comercial/claves-consulta.ts` — convención `"comercial/<recurso>"` / `"comercial/<recurso>/detalle"`. Nuevas: `CLAVE_APROBACIONES_PENDIENTES` y `CLAVE_COTIZACION_APROBACIONES_HISTORIAL`; reutilizar `CLAVE_COTIZACION_DETALLE` / `CLAVE_COTIZACIONES` / `CLAVE_COTIZACIONES_RESUMEN` al resolver.
- **Manejo de errores**: `normalizarErrorAccion` (`cotizaciones-error-handler.ts`) distingue 422 (mostrar verbatim). Sumar branch para 409 (carrera) usando `esError409` de `@/compartido/api` — mismo patrón que `dialogo-fijar-numeracion.tsx:68`.
- **Modales/diálogos**: (a) auto-gestionado con `Dialog`+`DialogTrigger` (`cotizacion-acciones.tsx`), (b) controlado por props `abierto`/`onOpenChange` (`dialogo-condiciones-version.tsx`). Formularios zod: input controlado + `schema.safeParse` en submit + error inline. Clonar para `schemaRechazar`/`schemaObservar` (required) y `schemaAprobar` (opcional).
- **Tabla + paginación**: `TablaDatos` genérico (`compartido/componentes/tabla-datos/`) — columnas declarativas (`ColumnaTabla<T>`), acciones por fila (`AccionTabla<T>`, `href` o `alSeleccionar`), paginación server-side (`paginacion: { pagina, porPagina, total, alCambiarPagina }`). `cotizaciones-tabla.tsx` es el ejemplo más cercano.
- **Badge de estado**: `estado-cotizacion-badge.tsx` — patrón aplicable a un badge de `estado` de solicitud (`EN_APROBACION`/`APROBADA`/`RECHAZADA`/`OBSERVADA`).
- **Sidebar**: `app-sidebar.tsx`, array `navMain[].items[]` con `{ title, url }`. Agregar `{ title: "Aprobación de cotizaciones", url: "/comercial/aprobaciones" }` en el bloque "Gestion Comercial" (línea 92-109).
- **Rutas/vistas**: `app/(privado)/comercial/<recurso>/page.tsx` (server component, parsea `searchParams`, arma `filtros`, renderiza `<SiteHeader>` + `<XxxVista/>`); el módulo expone `modulos/comercial/<slice>/vistas/xxx-vista.tsx` (client, hook de listado + `PaginaListado` + tabla). `cotizaciones/page.tsx` es la plantilla.
- **Historial embebido**: precedente `HistorialProspecto` (`prospectos/componentes/historial-prospecto.tsx`) + `HistorialFeed` — patrón de composición (loading/error/tabla), no reusable directo por forma de dato distinta.

## 4. Estructura propuesta del slice `aprobaciones`

```
src/modulos/comercial/aprobaciones/
├── tipos/
│   ├── aprobaciones.tipos.ts        // SolicitudAprobacion, ItemBandejaAprobacion,
│   │                                 // PayloadAprobar/Rechazar/Observar, RespuestaPaginadaAprobaciones
│   └── aprobaciones.schemas.ts      // schemaRechazar (motivo req.), schemaObservar (comentario req.),
│                                     // schemaAprobar (comentario opcional)
├── servicios/
│   ├── aprobaciones-api.ts          // aprobarSolicitud, rechazarSolicitud, observarSolicitud,
│   │                                 // listarPendientes, obtenerHistorialAprobaciones(idCotizacion)
│   └── aprobaciones-queries.ts      // useAprobacionesPendientesQuery, useHistorialAprobacionesQuery,
│                                     // useAprobarMutation, useRechazarMutation, useObservarMutation
├── componentes/
│   ├── solicitud-estado-badge.tsx   // badge EN_APROBACION/APROBADA/RECHAZADA/OBSERVADA
│   ├── aprobaciones-bandeja-tabla.tsx  // TablaDatos + acciones por fila
│   ├── dialogo-resolver-solicitud.tsx // parametrizado por accion (aprobar/rechazar/observar)
│   └── historial-aprobaciones.tsx   // feed de solicitudes para el detalle de cotización
└── vistas/
    └── aprobaciones-vista.tsx       // vista de la bandeja (usa PaginaListado)
```

Ruta nueva: `src/app/(privado)/comercial/aprobaciones/page.tsx` (clon de `cotizaciones/page.tsx`, sin `[id]` — "ver" apunta a `/comercial/cotizaciones/:idCotizacion`). Espeja el layout de `cotizaciones/`.

## 5. Puntos de integración con `cotizaciones`

- **`enviarCotizacion`**: se queda en `cotizaciones-api.ts` (la ruta sigue siendo `/cotizaciones/:id/enviar`, se dispara desde `CotizacionAcciones`), cambia retorno a `Promise<{ id: string }>` y copy a "Solicitar aprobación". Documentar en comentario que el backend-owner es `aprobacion`. **Decisión a confirmar en sdd-design.**
- **`EstadoCotizacion` / `BucketCotizacion` / `ResumenCotizaciones` / `accionesPermitidas`**: se extienden en `cotizaciones.tipos.ts` (son tipos de la cotización, no de la solicitud).
- **KPIs**: `CotizacionesKpis` necesita una 5ta tarjeta "Pendientes de aprobación" alimentada por el `useResumenCotizacionesQuery` existente.
- **Historial en el detalle**: sección/card nueva en `cotizacion-detalle-vista.tsx` (layout de secciones apiladas, sin Tabs), con patrón condicional. `HistorialAprobaciones` vive en `aprobaciones/componentes/`; el montaje en `cotizaciones/vistas/` — import cruzado `cotizaciones → aprobaciones`, aceptable (ya existe `cotizaciones → tarifarios`).
- **Acciones resolver**: visibles para todos; se lanzan desde la fila de la bandeja y potencialmente también desde el detalle cuando está `PENDIENTE_APROBACION`, reusando el mismo hook de mutación.

## 6. Riesgos / preguntas abiertas para diseño

1. **Invalidación tras resolver**: cambian a la vez la solicitud (bandeja), la cotización (detalle/estado/numeración/vencimiento) y los KPIs. Invalidar `CLAVE_APROBACIONES_PENDIENTES`, `CLAVE_COTIZACIONES`, `CLAVE_COTIZACIONES_RESUMEN`, `CLAVE_COTIZACION_DETALLE` juntas — fácil olvidar una.
2. **409 de carrera**: mensaje inline específico ("la solicitud ya fue resuelta por otra operación") + refetch de la bandeja para que la fila desaparezca.
3. **Reenvío abre solicitud nueva**: el historial puede tener N filas por cotización. Decidir orden/agrupación (backend entrega cronológico; puede convenir más reciente primero).
4. **`Pipeline()` no contempla `PENDIENTE_APROBACION`** — bug silencioso confirmado, corregir explícitamente.
5. **Colisión de nombres en sidebar**: ya existe "Aprobaciones" (viáticos, `href="#"`). Usar "Aprobación de cotizaciones".
6. **Ubicación de `enviarCotizacion`** (cotizaciones-api.ts vs aprobaciones-api.ts) — zanjar en sdd-design.
7. **Validación zod motivo/comentario**: no depender del 400; definir mínimos propios (`.min(1, "...")`, patrón `schemaPerdida`/`schemaNuevaVersion`), sin reglas extra.
8. **Grid de KPIs con 5 tarjetas**: decidir breakpoint (`sm:grid-cols-5` vs dejar la 5ta en fila propia).
