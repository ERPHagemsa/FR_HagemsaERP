# Dashboard Comercial — Fase 1 (MVP, frontend)

## Why

El área Comercial (BC-03) no tiene una pantalla de arranque: hoy el Ejecutivo y el
Gerente saltan entre los listados de Cotizaciones y Solicitudes para saber "cómo va
el embudo" y "qué toca hacer hoy". La ruta `/dashboard` renderiza aún el placeholder
de shadcn (`SectionCards` + `ChartAreaInteractive` con datos demo), sin valor real.

Fase 1 entrega **un único dashboard** que sirve a ambos roles mediante un **filtro
global por ejecutivo (Todos / uno)**: el Gerente lo deja en "Todos" (toda el área) y
el Ejecutivo lo fija en sí mismo (su pipeline). Mismo layout para ambos; solo cambia
el nivel de agregación. No hay variante por rol.

El dashboard es una preocupación de **lectura/composición**: reutiliza los hooks de
lectura ya existentes (los mismos que consumen las tablas de Cotizaciones y
Solicitudes). No posee datos, no duplica consultas y **no toca el backend**.

## Alcance de datos (decisión consciente de Fase 1)

- **Periodo por defecto = mes en curso** como intención de producto, pero
  `/cotizaciones/resumen` y `/solicitudes-cliente/resumen` devuelven **contadores
  all-time** y no aceptan rango de fechas. Por tanto los KPI de Fase 1 son **all-time
  bajo el filtro de ejecutivo/contexto**. Limitación conocida, se resuelve en Fase 2.
- **Umbral "por vencer" = 3 días (72 h)** antes de `fechaVencimiento`, calculado
  **en cliente**. Es la **única deuda reconocida** de Fase 1: una fuga temporal de
  regla de negocio al frontend, a saldar en Fase 2 con un bucket `porVencer` en backend.

## What Changes

- **Nuevo slice `src/modulos/comercial/dashboard/`** (vertical slice; `tipos`,
  `servicios`, `componentes`, `vistas`). Solo lectura, cero mutaciones.
- **Montaje en el índice del módulo `/comercial`**: `src/app/(privado)/comercial/page.tsx`
  deja de mostrar su placeholder (métricas hardcodeadas) y monta `DashboardVista`. El
  dashboard genérico transversal del ERP (`/dashboard`, `dashboard-content.tsx`) y el
  home (`/`) NO se tocan — son transversales, no del módulo Comercial.
  (Corrección post-implementación: el destino inicial fue `/dashboard` por error; el
  dashboard del área vive en el índice del módulo, `/comercial`.)
- **Widgets**:
  1. **Franja de KPI (embudo)** — solo conteos. Cotizaciones (`enPreparacion`,
     `pendientesAprobacion`, `enviadas`, `ganadas`, `perdidas` + total) vía
     `useResumenCotizacionesQuery`; Solicitudes (`disponibles`, `enCotizacion`,
     `sinRespuesta`, `cotizadas` + total) vía `useResumenSolicitudesQuery` (ya existe).
  2. **Listas accionables ("qué hacer hoy")** — cotizaciones pendientes de aprobación;
     solicitudes sin cotizar (PENDIENTE, más antiguas primero); cotizaciones enviadas
     por vencer (regla 72 h en cliente). Datos vía `useListarCotizaciones` /
     `useSolicitudesClienteQuery`.
  3. **Filtro global de ejecutivo** (`useEjecutivosCotizacionesQuery`) que propaga
     `idEjecutivoResponsable` a los widgets 1 y 2.
  4. **Calendario de servicios ganados** — **embebe** `CalendarioVista` del slice
     `calendario` (ya implementado). Este change NO re-especifica el calendario: solo
     lo reusa.

## Capabilities

### New Capabilities
- `dashboard-comercial`: pantalla de composición de solo lectura para Comercial
  (franja de KPI del embudo, listas accionables, filtro global de ejecutivo, y embebido
  del calendario de ganadas), sirviendo a Ejecutivo y Gerente con un mismo layout.

### Modified Capabilities
- None. El calendario se embebe tal cual; su spec (`calendario`) no cambia.

## Approach

Dashboard = **composición de hooks de lectura existentes; cero duplicación de
consultas**. El frontend hace solo presentación (formato, layout, orden, coloreo de
urgencia). No calcula agregaciones de negocio (sumas de dinero, win rate): eso es
Fase 2 backend. El único cálculo de negocio permitido en cliente es el umbral
"por vencer" (deuda documentada). Si falta un hook fino en un módulo (p. ej. envolver
`obtenerResumenSolicitudes`), agregarlo en ese módulo es in-scope y NO es cambio de
backend — de hecho `useResumenSolicitudesQuery` ya existe.

## Non-Goals (diferidos a Fase 2 — change separado en el backend BC03_Comercial)

KPI de dinero (monto ganado $, valor de pipeline $, ticket promedio), win rate,
ranking por ejecutivo, motivos de pérdida agrupados, mix por modalidad/tipoLinea y por
canal, contratos por vencer (`vigenciaFin`), filtrado real por rango de fechas, y
**cualquier endpoint nuevo de agregación**. Fase 1 no agrega código de backend.

**Filtro por ejecutivo en Solicitudes → diferido a Fase 2 (decisión explícita).** Hoy
`ListarSolicitudesClienteDto` y `ResumenSolicitudesClienteDto` NO exponen ningún parámetro
de ejecutivo/registrante (solo `estado, bucket, origenTipo, origenId, busqueda`). Además,
`SolicitudCliente` no tiene `idEjecutivoResponsable` (a diferencia de `Cotizacion`): la
persona vinculada es el **registrante** (`usuarioCreacion` + `nombreRegistrante`), que es
"quién la cargó", no "el dueño del negocio". Por eso en Fase 1 los widgets de Solicitudes
quedan **a nivel área** (rotulado). Agregar el filtro requiere un parámetro nuevo en el
backend y definir su semántica (¿filtrar por registrante?) — eso es Fase 2.

## Affected Areas

| Área | Impacto | Descripción |
|------|--------|-------------|
| `src/modulos/comercial/dashboard/**` | New | Slice nuevo (widgets, tipos de presentación, orquestación). |
| `src/app/(privado)/comercial/page.tsx` | Modified | Índice del módulo Comercial: reemplaza el placeholder (métricas hardcodeadas) por `DashboardVista`. |
| `src/modulos/comercial/calendario/**` | Modified | Se extrae `CalendarioPanel` de `CalendarioVista` (refactor presentacional; sin cambio de spec). |
| `src/modulos/comercial/calendario/**` | Reused | Se embebe `CalendarioVista`; sin cambios de spec. |
| Endpoints `/cotizaciones/*`, `/solicitudes-cliente/*` | Reused | Solo lectura; sin cambios de backend ni de proxy. |

## Risks

| Riesgo | Prob. | Mitigación |
|------|------|------------|
| Deuda "por vencer" en cliente se vuelve permanente | Media | Documentarla explícitamente como deuda de Fase 1 con dueño (bucket `porVencer` backend en Fase 2). |
| KPI all-time se leen como "del mes" | Media | Rotular claramente que los conteos son all-time bajo el contexto hasta que Fase 2 agregue rango. |
| `CalendarioVista` trae su propio wrapper (`PaginaListado`/cabecera) y no encaja como widget | Media | Embeber la vista y, si hace falta, extraer una variante embebible del grid sin re-especificar el calendario. |
| Tentación de calcular montos/win rate en cliente | Baja | Principio arquitectónico explícito: presentación sí, agregación de negocio no. |

## Rollback Plan

Cambio aditivo y aislado. Rollback = revertir el commit que reemplaza
`dashboard-content.tsx` y eliminar el slice `src/modulos/comercial/dashboard/`; la
ruta `/dashboard` vuelve al placeholder previo. Sin migraciones ni estado persistido:
no hay datos que revertir.

## Dependencies

- Slice `calendario` implementado (verificado en `src/modulos/comercial/calendario/`).
- Endpoints de resumen/listado de Cotizaciones y Solicitudes vivos (ya en uso por las
  tablas existentes).

## Success Criteria

- [ ] `/dashboard` muestra la franja de KPI (Cotizaciones + Solicitudes) y las listas
      accionables, sin placeholder demo.
- [ ] El filtro global de ejecutivo (Todos / uno) recalcula KPI y listas.
- [ ] La lista "por vencer" resalta cotizaciones enviadas dentro de las 72 h previas a
      `fechaVencimiento` (cálculo en cliente, documentado como deuda).
- [ ] El calendario de ganadas queda embebido reutilizando el slice existente.
- [ ] Cero cambios de backend/proxy; cero duplicación de consultas (reusa los hooks de
      resumen ya consumidos por las tablas).
- [ ] `pnpm build` + `pnpm lint` en verde (no hay test runner — Standard Mode).
