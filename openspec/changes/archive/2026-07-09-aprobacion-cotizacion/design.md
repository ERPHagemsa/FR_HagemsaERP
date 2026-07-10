# Diseño: Loop de aprobación de cotizaciones (BC03 Épica 2) en el frontend

Cómo se implementa en el front el paso obligatorio de aprobación. Estrategia: **slice nuevo `aprobaciones` que espeja `cotizaciones`, reusando toda la infra transversal existente** (cliente HTTP, proxy, `useConsulta`/`useMutar`, `TablaDatos`, diálogos zod, badges) + retoques aditivos al slice `cotizaciones`. Cero cambios de backend, cero cambios de proxy.

## Decisiones de arquitectura

| # | Decisión | Elección | Alternativa rechazada | Fundamento |
|---|----------|----------|-----------------------|-----------|
| D1 | Ubicación y nombre de `enviarCotizacion` | Se queda en `cotizaciones/servicios/cotizaciones-api.ts` **y se renombra a `solicitarAprobacion`** (retorno `Promise<{ id: string }>`) | Moverla a `aprobaciones-api.ts` por dueño de dominio; o conservar el nombre `enviarCotizacion` | **Ubicación:** el actor es el ejecutivo y el disparador es la cotización; la ruta HTTP sigue siendo `/cotizaciones/:id/enviar`. Menos sorpresa y **cero import cruzado** `cotizaciones → aprobaciones` en la capa de servicios. **Nombre:** la razón de ser de este cambio es que "enviar" miente — no envía nada al cliente, abre una solicitud de aprobación. Arreglar el copy de la UI y dejar `enviarCotizacion` en el código conserva la mentira justo donde la lee el próximo desarrollador. El rename es mecánico (2 call-sites) y de riesgo nulo. Se documenta en comentario que el backend-owner de la feature es `aprobacion`. |
| D2 | Orden del historial | Render en el orden que entrega el backend (cronológico); el front **no reordena** | Invertir a "más reciente primero" en el cliente | El backend es fuente de verdad del orden; reordenar duplica lógica y diverge si cambia el contrato. La traza cronológica lee natural (envío → resolución → reenvío). |
| D3 | Superficie de resolución | Aprobar/rechazar/observar en **DOS superficies**: fila de la bandeja **y** detalle de la cotización cuando está `PENDIENTE_APROBACION`, reusando el **mismo** `dialogo-resolver-solicitud` y los mismos hooks de mutación | Solo desde la bandeja | El aprobador puede llegar por cualquiera de los dos caminos; un único componente/hook evita divergencia de comportamiento e invalidación. |
| D4 | Breakpoint grilla KPIs (5 tarjetas) | `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` | `sm:grid-cols-5` (cramping) o dejar la 5.ª en fila propia (asimetría) | Cada tarjeta necesita ~180px legibles (etiqueta + número + descripción). A `sm` (640px) 5 columnas dan ~128px (ilegible); 3 columnas dan ~213px. A `lg` (1024px) 5 columnas dan ~205px. Criterio = ancho mínimo legible por breakpoint, no "a ojo". |
| D5 | KPI `pendientesAprobacion` | Se muestra **solo** el valor del backend (`data.pendientesAprobacion` de `/cotizaciones/resumen`); el front **nunca lo computa** | Derivarlo contando filas | El backend ya expone el bucket (fuente única); computar en el front diverge del predicado del servidor. Igual que los otros 4 KPIs. |
| D6 | Cómo obtiene el detalle el `idSolicitud` para resolver | Se deriva del historial ya cargado: la única solicitud con `estado === "EN_APROBACION"` (ver "Resolución de la solicitud vigente") | Un endpoint nuevo `GET /cotizaciones/:id/aprobaciones/vigente`; o pasar el `id` que devuelve `solicitarAprobacion` | Los endpoints de resolución son `POST /aprobaciones/:idSolicitud/…`, pero el detalle solo conoce `cotizacion.id`. El historial ya se consulta en esa misma pantalla (D3 + card de historial), así que el dato está en memoria: **cero requests extra, cero cambios de backend**. El invariante lo garantiza el backend (quórum = 1 → a lo sumo una solicitud `EN_APROBACION` por cotización). |

### Estructura del slice `aprobaciones` (espejo de `cotizaciones`/`prospectos`)

```
src/modulos/comercial/aprobaciones/
├── tipos/
│   ├── aprobaciones.tipos.ts     // SolicitudAprobacion, ItemBandejaAprobacion,
│   │                             // RespuestaPaginadaAprobaciones, PayloadAprobar/Rechazar/Observar
│   └── aprobaciones.schemas.ts   // schemaAprobar, schemaRechazar, schemaObservar
├── servicios/
│   ├── aprobaciones-api.ts       // aprobarSolicitud, rechazarSolicitud, observarSolicitud,
│   │                             // listarPendientes, obtenerHistorialAprobaciones
│   └── aprobaciones-queries.ts   // useAprobacionesPendientesQuery, useHistorialAprobacionesQuery,
│                                 // useAprobarMutation, useRechazarMutation, useObservarMutation
├── componentes/
│   ├── solicitud-estado-badge.tsx
│   ├── aprobaciones-bandeja-tabla.tsx
│   ├── dialogo-resolver-solicitud.tsx   // parametrizado por accion
│   └── historial-aprobaciones.tsx       // feed para el detalle de cotización
└── vistas/
    └── aprobaciones-vista.tsx
```
Ruta: `src/app/(privado)/comercial/aprobaciones/page.tsx` (clon de `cotizaciones/page.tsx`, sin `[id]`).

## Contrato de tipos

```ts
// aprobaciones/tipos/aprobaciones.tipos.ts
export type EstadoSolicitud = "EN_APROBACION" | "APROBADA" | "RECHAZADA" | "OBSERVADA";

export type SolicitudAprobacion = {          // ítem del historial (GET /cotizaciones/:id/aprobaciones)
  id: string;
  idCotizacion: string;
  numeroVersion: number;
  estado: EstadoSolicitud;
  validezDias: number;
  comentario: string | null;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioResolucion: string | null;
  fechaResolucion: string | null;
};

export type ItemBandejaAprobacion = {        // ítem de GET /aprobaciones/pendientes
  id: string;
  idCotizacion: string;
  numeroVersion: number;
  validezDias: number;
  fechaCreacion: string;
  usuarioCreacion: string;
  numeroCotizacion: number | null;
  anioCotizacion: number | null;
  nombreEjecutivoResponsable: string;
};

export type RespuestaPaginadaAprobaciones = {  // misma forma que RespuestaPaginadaCotizaciones
  data: ItemBandejaAprobacion[];
  total: number;
  pagina: number;
  porPagina: number;
};

export type PayloadAprobar  = { comentario?: string };
export type PayloadRechazar = { motivo: string };
export type PayloadObservar = { comentario: string };
```

```ts
// aprobaciones/tipos/aprobaciones.schemas.ts (zod 4) — no depender del 400 del backend
export const schemaAprobar  = z.object({ comentario: z.string().trim().optional() });
export const schemaRechazar = z.object({ motivo: z.string().trim().min(1, "El motivo es obligatorio.") });
export const schemaObservar = z.object({ comentario: z.string().trim().min(1, "El comentario es obligatorio.") });
```

**Extensiones en `cotizaciones/tipos/cotizaciones.tipos.ts`** (son tipos de la cotización, no de la solicitud):
- `EstadoCotizacion` += `"PENDIENTE_APROBACION"`.
- `BucketCotizacion` += `"pendientesAprobacion"`.
- `ResumenCotizaciones` += `pendientesAprobacion: number`.

> Los `switch` exhaustivos (`accionesPermitidas`, `estado-cotizacion-badge`) romperán el build al agregar el enum — red de seguridad que marca dónde falta el `case`.

## Capa de servicios y hooks

```ts
// aprobaciones-api.ts (clona el estilo documentado por contrato de cotizaciones-api.ts)
aprobarSolicitud(id, payload?: PayloadAprobar): Promise<void>          // POST /aprobaciones/:id/aprobar → 204
rechazarSolicitud(id, payload: PayloadRechazar): Promise<void>        // POST /aprobaciones/:id/rechazar → 204
observarSolicitud(id, payload: PayloadObservar): Promise<void>        // POST /aprobaciones/:id/observar → 204
listarPendientes(params: { pagina; porPagina }): Promise<RespuestaPaginadaAprobaciones>  // GET /aprobaciones/pendientes
obtenerHistorialAprobaciones(idCotizacion): Promise<SolicitudAprobacion[]>  // GET /cotizaciones/:id/aprobaciones (array pelado)
```

```ts
// aprobaciones-queries.ts (useConsulta lectura / useMutar escritura)
useAprobacionesPendientesQuery(params) // clave CLAVE_APROBACIONES_PENDIENTES
useHistorialAprobacionesQuery(idCot)   // clave CLAVE_COTIZACION_APROBACIONES_HISTORIAL
useAprobarMutation() / useRechazarMutation() / useObservarMutation()  // ver invalidación
```

**Rename en `cotizaciones/servicios/cotizaciones-api.ts` (D1):**
```ts
// antes: enviarCotizacion(id, payload?): Promise<void>            // POST /cotizaciones/:id/enviar → 204
// ahora: solicitarAprobacion(id, payload?): Promise<{ id: string }>  // POST /cotizaciones/:id/enviar → 201 { id }
//        ^ el `id` de la respuesta es el de la SolicitudAprobacion creada, NO el de la cotización.
```
Call-sites a actualizar (son los únicos dos):
- `cotizaciones/servicios/cotizaciones-queries.ts` → `useEnviarCotizacionMutation` pasa a `useSolicitarAprobacionMutation`.
- `cotizaciones/componentes/cotizacion-acciones.tsx` → consumo del hook + copy del diálogo.

La ruta HTTP **no cambia** (`POST /cotizaciones/:id/enviar`): el rename es solo del lado del front.

### Resolución de la solicitud vigente (D6)

El detalle de la cotización conoce `cotizacion.id`, pero los endpoints de resolución piden el `idSolicitud`. Se deriva del historial que esa misma pantalla ya carga:

```ts
// cotizacion-detalle-vista.tsx — el historial ya está en memoria (card de historial, D3)
const solicitudVigente = historial?.find((s) => s.estado === "EN_APROBACION") ?? null;
```

Reglas:
- Las acciones aprobar/rechazar/observar del detalle se renderizan **solo si** `cotizacion.estado === "PENDIENTE_APROBACION"` **y** `solicitudVigente !== null`.
- Si el estado es `PENDIENTE_APROBACION` pero no hay solicitud vigente en el historial (desincronización o historial aún cargando), **no** se renderizan las acciones. No se inventa un `id` ni se dispara un request especulativo.
- El invariante "a lo sumo una solicitud `EN_APROBACION` por cotización" lo garantiza el backend (quórum = 1 + update condicional). El front **no** valida ni desempata: toma la primera coincidencia.
- La bandeja no necesita esto: `ItemBandejaAprobacion.id` **ya es** el `idSolicitud`.

**Claves nuevas en `claves-consulta.ts`:**
```ts
export const CLAVE_APROBACIONES_PENDIENTES = "comercial/aprobaciones/pendientes";
export const CLAVE_COTIZACION_APROBACIONES_HISTORIAL = "comercial/cotizaciones/aprobaciones-historial";
```

## Estrategia de invalidación (CRÍTICO)

`useConsulta`/`useMutar` no invalidan solo: cada `onSuccess` llama `invalidarConsulta` a mano. Al resolver cambian a la vez la solicitud, la cotización (estado/numeración/vencimiento) y los KPIs. Para no olvidar ninguna clave, se define un **helper único**:

```ts
// aprobaciones-queries.ts — convención para las 3 mutaciones de resolución
function invalidarTrasResolver() {
  invalidarConsulta(CLAVE_APROBACIONES_PENDIENTES);           // la fila sale de la bandeja
  invalidarConsulta(CLAVE_COTIZACIONES);                      // listado
  invalidarConsulta(CLAVE_COTIZACIONES_RESUMEN);              // KPIs
  invalidarConsulta(CLAVE_COTIZACION_DETALLE);                // badge / pipeline / acciones
  invalidarConsulta(CLAVE_COTIZACION_APROBACIONES_HISTORIAL); // la solicitud cambia de estado en el feed
}
```
La última clave es la que se olvida: resolver **cambia el `estado` de la solicitud**, que es exactamente lo que renderiza `historial-aprobaciones`. Sin ella, quien resuelve desde el detalle (D3) ve el badge de la cotización actualizado pero el historial congelado en `EN_APROBACION`.
Las tres mutaciones (aprobar/rechazar/observar) llaman `invalidarTrasResolver()` en `onSuccess` — **una sola fuente de verdad de invalidación**. Además, `useSolicitarAprobacionMutation` suma `CLAVE_APROBACIONES_PENDIENTES` y `CLAVE_COTIZACION_APROBACIONES_HISTORIAL` al set que ya invalidaba (`CLAVE_COTIZACIONES` + `CLAVE_COTIZACIONES_RESUMEN` + `CLAVE_COTIZACION_DETALLE`): la solicitud nueva agrega una fila a la bandeja **y** una entrada al historial del detalle.

## Manejo de errores

| Código | Origen | Manejo |
|--------|--------|--------|
| `409` | Carrera: solicitud ya resuelta / cotización con solicitud vigente | `esError409(error)` de `@/compartido/api` (patrón de `dialogo-fijar-numeracion.tsx:68`): **mensaje inline** en el diálogo + `invalidarConsulta(CLAVE_APROBACIONES_PENDIENTES)` para que la fila desaparezca de la bandeja. |
| `422` | Estado no permite / sin líneas | Verbatim vía `normalizarErrorAccion` (reusar `cotizaciones-error-handler`). |
| `400` | UUID/validez/motivo faltante | Prevenido por zod antes del POST; si llega, mensaje genérico. |

## Componentes UI (shadcn)

| Componente | Composición |
|-----------|-------------|
| `aprobaciones-bandeja-tabla` | `TablaDatos<ItemBandejaAprobacion>`: columnas (`nº/año` o "Sin numerar", versión, ejecutivo, fecha, validez), `AccionTabla` "Ver" → `href` `/comercial/cotizaciones/:idCotizacion` + acciones aprobar/rechazar/observar que abren el diálogo. Paginación server-side (`paginacion: { pagina, porPagina, total, alCambiarPagina }`). |
| `dialogo-resolver-solicitud` | Patrón diálogo zod controlado (`abierto`/`onOpenChange`), **parametrizado por `accion`** (`"aprobar"\|"rechazar"\|"observar"`): elige schema, label, textarea (opcional/obligatorio) y hook. Recibe `idSolicitud: string` como prop — desde la bandeja es `fila.id`, desde el detalle es `solicitudVigente.id` (D6). `DialogTitle` siempre presente. |
| `solicitud-estado-badge` | `Badge` con variant por `EstadoSolicitud` (patrón de `estado-cotizacion-badge`). |
| `historial-aprobaciones` | Feed apilado de `SolicitudAprobacion[]` en el detalle; usa `solicitud-estado-badge`, muestra comentario/motivo, usuario/fecha de creación y resolución. Estados loading (`Skeleton`) / vacío (`Empty`) / error (`Alert`). |

### Diagrama de secuencia — resolver → invalidar → refetch

```
Aprobador → dialogo-resolver-solicitud → useResolver Mutation → aprobaciones-api (POST /aprobaciones/:id/:accion)
                                                                        │
                       ┌── 204 ──────────────────────────────────────┘
                       ▼
             invalidarTrasResolver()  ── invalida ──▶ CLAVE_APROBACIONES_PENDIENTES (bandeja refetch, fila sale)
                       │                              CLAVE_COTIZACIONES / _RESUMEN (listado + KPIs)
                       │                              CLAVE_COTIZACION_DETALLE (badge/pipeline/acciones)
                       │                              CLAVE_COTIZACION_APROBACIONES_HISTORIAL (feed del detalle)
                       ▼
             toast.success + cierra diálogo
                       │
             ┌── 409 ──┘  → esError409 → mensaje inline + invalida CLAVE_APROBACIONES_PENDIENTES (fila obsoleta sale)
```

## Integración con `cotizaciones`

| Punto | Cambio |
|-------|--------|
| `enviarCotizacion` (`cotizaciones-api.ts:129`) | **Rename a `solicitarAprobacion`** (D1); retorno `Promise<void>` → `Promise<{ id: string }>`; comentario de contrato `204` → `201 { id }`. Ruta HTTP sin cambios. |
| `useEnviarCotizacionMutation` (`cotizaciones-queries.ts:153`) | **Rename a `useSolicitarAprobacionMutation`**; suma `CLAVE_APROBACIONES_PENDIENTES` y `CLAVE_COTIZACION_APROBACIONES_HISTORIAL` a la invalidación. |
| `DialogEnviar` (`cotizacion-acciones.tsx`) | Copy "Enviar cotización" → **"Solicitar aprobación"**; texto de éxito honesto ("Solicitud de aprobación enviada"). Consume el hook renombrado. |
| `estado-cotizacion-badge.tsx` | Nuevo `case "PENDIENTE_APROBACION"`: variant `"outline"` con acento, etiqueta "Pendiente de aprobación". |
| `accionesPermitidas` (`:681`) | Nuevo `case "PENDIENTE_APROBACION"`: todo `false` (sin editar ni reenviar mientras está pendiente). |
| `Pipeline()` (`cotizacion-detalle-vista.tsx:201`) | Insertar paso intermedio `PENDIENTE_APROBACION` entre `BORRADOR` y `ENVIADA`: `pasos = [Borrador, Pendiente de aprobación, Enviada, Ganada/Perdida]`; corrige el `indiceActual = -1` (bug visual). |
| Historial + acciones en el detalle | Montar `<HistorialAprobaciones idCotizacion>` como card apilada; cuando estado `=== "PENDIENTE_APROBACION"` **y** exista `solicitudVigente` (D6), exponer acciones resolver (D3) pasándole `solicitudVigente.id`. Import cruzado `cotizaciones → aprobaciones` en la capa de vistas, aceptable (ya existe `cotizaciones → tarifarios`). |
| `CotizacionesKpis` (`cotizaciones-kpis.tsx:40`) | 5.ª tarjeta `pendientesAprobacion` (etiqueta "Pendientes de aprobación", icono `ClipboardCheck`, acento ámbar/índigo); grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` (D4). |
| `app-sidebar.tsx` | En bloque "Gestion Comercial": `{ title: "Aprobación de cotizaciones", url: "/comercial/aprobaciones" }` — label específico para no colisionar con "Aprobaciones" de viáticos (`href="#"`). |
| Ruta | `app/(privado)/comercial/aprobaciones/page.tsx` clon de `cotizaciones/page.tsx`. |

## Estrategia de testing

Sin test runner (Standard Mode). Gate = `pnpm build` + `pnpm lint` + verify adversarial. Los `switch` exhaustivos sobre `EstadoCotizacion` son la red de seguridad de compilación.

## Rollback

Confirmado: el bloque **B (slice `aprobaciones`, B1–B6) es puramente aditivo** — quitar ruta, ítem de sidebar y carpeta lo elimina sin tocar `cotizaciones`. **A2–A6** revierten quitando el enum y sus cases (el compilador guía). **A1 (`enviar`) es el único no aditivo y el único acoplado al backend**: revertir tipo a `Promise<void>` y copy solo restaura el front si el backend también revirtiera; contra el backend actual el contrato viejo ya no funciona.

## Preguntas abiertas

Ninguna. Las 4 preguntas abiertas de la propuesta quedan cerradas como D1–D5. **D6** no venía de la propuesta: surgió al revisar `tasks.md` (los endpoints de resolución piden `idSolicitud` y el detalle solo tiene `cotizacion.id`) y se cierra acá para que la implementación no tenga que improvisarlo.
