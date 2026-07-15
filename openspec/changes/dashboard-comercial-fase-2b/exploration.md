# Exploration — dashboard-comercial-fase-2b

Rewire the `/comercial` dashboard so it stops rendering count-only cards and consumes the 8 BC03 Fase 2 endpoints to show the real decision-grade dashboard (money KPIs PEN/USD, win rate, monthly trend, executive ranking, loss reasons, conversion funnel, pending actions) matching the approved mockup.

## Current State

- `src/app/(privado)/comercial/page.tsx` mounts `DashboardVista` (`src/modulos/comercial/dashboard/vistas/dashboard-vista.tsx`), which owns `idEjecutivoResponsable` state and renders `DashboardFiltroEjecutivo` → `DashboardKpis` → 3-col grid (`DashboardCotizacionesPorAprobar`, `DashboardSolicitudesSinCotizar`, `DashboardCotizacionesPorVencer`).
- `tipos/dashboard.tipos.ts` currently **forbids** money/winRate identifiers (Fase 1 guardrail) — must be extended for Fase 2b.
- `DashboardKpis` is pure counts (6 cotización buckets + 5 solicitud buckets) — entirely replaced by the new money KPI strip.
- `utilidades/por-vencer.ts` is documented Fase 1 client-side debt (72h filter) — made obsolete by the new `acciones-pendientes.porVencer72h` endpoint; should be retired.
- Fase 1 `design.md` documents why solicitudes have no ejecutivo filter — confirms Gap #5 below is a domain invariant, not a missing feature.

## Data-Fetching Approach (pattern to follow)

- `useConsulta<T>(fn, deps, {enabled?, clave?})` (`src/compartido/api/use-consulta.ts`) — no shared cache, cancel-on-stale via generation counter, `invalidarConsulta(clave)` for cross-tree refetch.
- Per-BC triad convention: `<recurso>-api.ts` (raw `clienteComercial.get<T>()` calls) + `<recurso>-queries.ts` (`useConsulta`/`useMutar` hooks, `clave` from `claves-consulta.ts`) + `tipos/<recurso>.tipos.ts`.
- `clienteComercial` → `/api/comercial` BFF proxy (`src/app/api/comercial/[[...path]]/route.ts`, `crearProxyBackend`) injects `Authorization: Bearer` server-side from httpOnly cookie. **No frontend auth work needed** — `bc03:dashboard:leer` is enforced backend-side.
- Money formatting precedent exists but is component-local: `formatearMoneda(monto, moneda)` in `cotizaciones/componentes/lineas-grid.utils.ts` — no shared `Dinero{pen,usd}` type exists yet anywhere.

## Backend Contracts (8 endpoints, `/api/dashboard/*`, all require `bc03:dashboard:leer`)

Sourced from `BC03_Comercial/docs/api/API-Dashboard.md`, `dashboard.controller.ts`, and the DTO files.

Key facts:
- PEN/USD always separate fields, never converted.
- `winRate` / `cicloPromedioDias` are `null`-safe on zero-data.
- `tendencia-mensual` ignores `desde`/`hasta` (fixed "last N months" window).
- `ranking-ejecutivos` does NOT accept `idEjecutivoResponsable`.
- `acciones-pendientes` is NOT period-dependent.

## Widget → Endpoint Mapping

| Mockup widget | Endpoint |
|---|---|
| KPI: Ganado / Pipeline / Ticket promedio | `kpis-monetarios` |
| KPI: Win rate (+ donut) | `win-rate` |
| KPI: Ciclo de cierre | `ciclo-cierre` |
| Ganado vs perdido bar chart | `tendencia-mensual` |
| Por vencer 72h / Esperando aprobación / Sin cotizar | `acciones-pendientes` |
| Ranking del equipo table | `ranking-ejecutivos` |
| Motivos de pérdida bars | `motivos-perdida` |
| Embudo del mes | `embudo-conversion` |

## Charting

recharts 3.8.0 is already a dependency and already used (`chart-area-interactive.tsx`, `flota-resumen.tsx`, socio-negocios dashboard) — **no new library needed**. The mockup's teal `#0d9488` / rose `#e11d48` / amber `#d97706` dataviz palette does **not exist anywhere** in the current theme — new decision for propose (recommend adding as global CSS vars, matching the existing `ChartConfig` / `var(--color-x)` pattern).

## Open Questions / Gaps

1. **Win-rate delta — RESOLVED (backend).** `GET /dashboard/win-rate` now returns `variacionVsMesAnterior` (percentage points, null-safe), mirroring `kpis-monetarios`. Frontend consumes it directly, no double-call. (BC03 commit `d1dfe4b`.)
2. **Ciclo-cierre delta — RESOLVED (backend).** `GET /dashboard/ciclo-cierre` now returns `variacionVsMesAnterior` (days, raw sign — fewer is better, frontend colors it). Frontend consumes directly. (BC03 commit `d1dfe4b`.)
3. **Ranking "Cotiz." column** — verify exact use-case DTO field name (likely `cantidadCerradas`). Confirm during spec/design against `obtener-ranking-ejecutivos.use-case.ts`.
4. **Período control vs `tendencia-mensual` — DECIDED.** The endpoint returns a fixed "last N months" window; a trend chart is inherently that, so the global período selector does NOT apply to this widget. No backend change.
5. **Sin-cotizar × ejecutivo filter — CONFIRMED impossible, not a deferral**: `FiltrosSolicitudesCliente` has no `idEjecutivoResponsable`; Fase 1 design.md explains it's a domain invariant (unassigned requests have no owner); `acciones-pendientes.solicitudesSinCotizar[]` reconfirms it at the API level (`idEjecutivoResponsable` always `null`). No backend work should be scoped.

## Recommended Approach

Rewire, don't rebuild: keep the `DashboardVista` / `DashboardFiltroEjecutivo` / `DashboardListaAccionable` shell (extended to carry money + severity), replace `DashboardKpis`, add new components per widget above, add a new `dashboard-api.ts` / `dashboard-queries.ts` pair (Fase 1 deliberately had none — documented reversal, not a violation), retire `por-vencer.ts`.

## Key Files

- `src/app/(privado)/comercial/page.tsx`
- `src/modulos/comercial/dashboard/**`
- `src/compartido/api/use-consulta.ts`
- `src/compartido/api/clientes-backend.ts`
- `src/modulos/comercial/cotizaciones/servicios/cotizaciones-{api,queries}.ts`
- `src/compartido/componentes/chart-area-interactive.tsx`
- `openspec/changes/dashboard-comercial-fase-1/design.md`
- `BC03_Comercial/docs/api/API-Dashboard.md`
- `BC03_Comercial/src/dashboard/interfaces/http/dashboard.controller.ts`
