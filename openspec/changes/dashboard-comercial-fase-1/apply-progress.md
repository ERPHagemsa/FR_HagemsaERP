# Apply Progress — Dashboard Comercial Fase 1 (frontend)

## Done (WU1 + WU2) — previous run

- [x] 1.1 `src/modulos/comercial/dashboard/tipos/dashboard.tipos.ts` — created.
      Presentation-only prop types for the dashboard widgets:
      `IdEjecutivoFiltro`, `DashboardFiltroEjecutivoProps`, `DashboardKpisProps`,
      `DashboardItemAccionable`, `DashboardListaAccionableProps`,
      `DashboardListaEspecificaProps`. No `monto*`/`winRate*` identifiers (D8
      guardrail verified). Widgets keep their own queries (design D2); this file
      only carries filter/display props, not resolved data — matches the
      `CotizacionesKpis`/`filtros` prop convention already used in the
      `cotizaciones` slice.
- [x] 1.2 `src/modulos/comercial/dashboard/utilidades/por-vencer.ts` — created.
      Pure `esPorVencer(fechaVencimiento, ahora, horas = 72)` +
      `filtrarPorVencer(items, ahora?, horas?)`, generic over
      `{ fechaVencimiento: string | null }` so it composes with
      `CotizacionResumen` from `cotizaciones.tipos.ts`. Carries the exact
      `// DEUDA Fase 1: mover a bucket porVencer del backend (Fase 2)` comment
      (design D6). Window is `[ahora, ahora + horas]` inclusive; already-overdue
      dates return `false` (matches spec scenario "fuera del umbral").
- [x] 2.1 `src/modulos/comercial/calendario/componentes/calendario-panel.tsx` —
      created. Extracted verbatim from the previous `calendario-vista.tsx` body:
      `agruparEventosPorDia`, `mesVisible` state, `useEventosCalendarioQuery`,
      cabecera/leyenda/grid + loading/error states — without the `PaginaListado`
      wrapper. Zero behavior change; only import paths adjusted (relative to the
      new `componentes/` location: `./calendario-cabecera`, `./calendario-leyenda`,
      `./calendario-mensual`, `../servicios/calendario-queries`,
      `../tipos/calendario.tipos`).
- [x] 2.2 `src/modulos/comercial/calendario/vistas/calendario-vista.tsx` —
      modified. Now a thin wrapper:
      `<PaginaListado><CalendarioPanel /></PaginaListado>`. Route
      `/comercial/calendario` (`src/app/(privado)/comercial/calendario/page.tsx`)
      is untouched and still imports `CalendarioVista` — verified via repo-wide
      grep, no other consumer of `CalendarioVista`.

## Done (WU3 + WU4) — this run

- [x] 3.1 `src/modulos/comercial/dashboard/componentes/dashboard-kpis.tsx` —
      created. `DashboardKpis({ idEjecutivoResponsable })`: Cotizaciones via
      `useResumenCotizacionesQuery({ idEjecutivoResponsable })` (5 buckets +
      total); Solicitudes via `useResumenSolicitudesQuery({})` (área, 4 buckets
      + total — `FiltrosResumenSolicitudes` verified to NOT accept
      `idEjecutivoResponsable`). Each section handles `isLoading` → `Skeleton`,
      `isError` → `Alert` + `extraerMensajeError`, missing data → zeros (`?? 0`).
      Not clickable (design D4 — indicator, not filter). Header label exactly
      "Totales del área (histórico)" with a descriptive all-time disclaimer.
      Zero business aggregation: only renders backend-provided counts.
- [x] 3.2 `src/modulos/comercial/dashboard/componentes/dashboard-filtro-ejecutivo.tsx`
      — created. `Select` fed by `useEjecutivosCotizacionesQuery()` (same hook
      `CotizacionesTabla` already consumes — zero new queries), controlled by
      `DashboardFiltroEjecutivoProps` (`idEjecutivoResponsable`, `alCambiar`), no
      internal state. Uses a `"TODOS"` sentinel value internally (Radix Select
      rejects `value=""`) mapped to `undefined` on change/render — matches
      `IdEjecutivoFiltro = string | undefined` from `dashboard.tipos.ts`.
- [x] 3.3 `src/modulos/comercial/dashboard/componentes/dashboard-lista-accionable.tsx`
      — created. Generic presentational component consuming
      `DashboardListaAccionableProps` verbatim: title, `items`, `isLoading` →
      3 `Skeleton` rows, `isError` → `Alert` + `mensajeError`, empty → "Sin
      elementos." text, otherwise a `Link`-per-item list (each item is
      `{ id, titulo, subtitulo?, enlace }`) plus an optional "Ver todas" link
      when `enlaceVerTodas` is provided. Zero data fetching — pure
      presentation, base for 3.4-3.6 (design D5).
- [x] 3.4 `src/modulos/comercial/dashboard/componentes/dashboard-cotizaciones-por-aprobar.tsx`
      — created. `useListarCotizaciones({ bucket: "pendientesAprobacion",
      idEjecutivoResponsable, porPagina: 5 })`, maps `CotizacionResumen[]` to
      `DashboardItemAccionable[]` (`titulo` = `codigoCotizacion ??
      origenNombre`, `subtitulo` = `origenNombre`, `enlace` =
      `/comercial/cotizaciones/${id}` — verified against
      `cotizaciones-tabla.tsx`'s `accionesCotizacion`). `enlaceVerTodas` =
      `/comercial/cotizaciones?bucket=pendientesAprobacion`.
- [x] 3.5 `src/modulos/comercial/dashboard/componentes/dashboard-solicitudes-sin-cotizar.tsx`
      — created. `useSolicitudesClienteQuery({ bucket: "disponibles",
      porPagina: 5 })` (confirmed real hook name — the task text's
      `useSolicitudesClienteQuery` matches the actual export in
      `solicitudes-cliente-queries.ts`, no invented hook). Client-side sort by
      `fechaCreacion` ascending (design.md Open Question — backend order for
      this bucket unconfirmed, so the component does not assume it). **No
      props** — deliberately does not accept `idEjecutivoResponsable`:
      `FiltrosSolicitudesCliente`/`FiltrosResumenSolicitudes` verified to have
      no ejecutivo filter field (structural guardrail, mirrors design D1's
      "no somewhere to leak an aggregation call" philosophy). `enlace` =
      `/comercial/solicitudes-cliente/${id}` (verified against
      `solicitudes-cliente-tabla.tsx`).
- [x] 3.6 `src/modulos/comercial/dashboard/componentes/dashboard-cotizaciones-por-vencer.tsx`
      — created. `useListarCotizaciones({ bucket: "enviadas",
      idEjecutivoResponsable })` (no `porPagina` — deliberately NOT capped
      before filtering, per task wording) + `filtrarPorVencer(data?.data ?? [])`
      from `utilidades/por-vencer.ts` (WU1) + `.slice(0, 5)` AFTER filtering
      (presentational cap to keep the widget compact and consistent with the
      other two lists — documented inline as non-business, since capping
      before the 72h filter could hide items that vencen soon but landed past
      page position 5).

## Gate results (Standard Mode, no test runner)

- `pnpm build`: **PASS**. Compiled successfully, TypeScript check passed, all
  55 routes generated including `/comercial/calendario` and `/dashboard`
  (dashboard route STILL untouched — still the demo placeholder, WU5 scope;
  the 6 new widgets are NOT mounted on any route yet, as expected for this
  run — verified they still compile/typecheck as unused-but-exported modules).
- `pnpm lint`: pre-existing repo-wide failure, **identical baseline to
  WU1+WU2** (103 errors / 1491 warnings, all in files untouched by this
  change — `activos`, `administracion`, `socio-negocios`, etc.). Filtered
  lint output for the 6 new files this run (`dashboard-kpis.tsx`,
  `dashboard-filtro-ejecutivo.tsx`, `dashboard-lista-accionable.tsx`,
  `dashboard-cotizaciones-por-aprobar.tsx`,
  `dashboard-solicitudes-sin-cotizar.tsx`,
  `dashboard-cotizaciones-por-vencer.tsx`): **zero errors, zero warnings**
  (grep of lint output for the 6 filenames returned no matches).

## Work Unit Evidence (WU3 + WU4)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm build` → PASS (Turbopack compiled successfully in 9.6s, TypeScript check passed in 9.8s, 55/55 routes generated, 0 errors) |
| Runtime harness command/scenario and exact result | N/A — widgets not mounted on any route yet (WU5 scope); no runtime boundary exists until `DashboardVista` composes them. `pnpm lint` filtered to the 6 new files: 0 errors, 0 warnings (repo-wide baseline unchanged at 103 errors / 1491 warnings, all pre-existing/unrelated) |
| Rollback boundary | Delete the 6 new files under `src/modulos/comercial/dashboard/componentes/`: `dashboard-kpis.tsx`, `dashboard-filtro-ejecutivo.tsx`, `dashboard-lista-accionable.tsx`, `dashboard-cotizaciones-por-aprobar.tsx`, `dashboard-solicitudes-sin-cotizar.tsx`, `dashboard-cotizaciones-por-vencer.tsx` — no other file was modified this run, zero shared-file edits |

## Done (WU5 + WU6) — this run

- [x] 4.1 `src/modulos/comercial/dashboard/vistas/dashboard-vista.tsx` —
      created. `"use client"`; `useState<IdEjecutivoFiltro>(undefined)` for
      `idEjecutivoResponsable` (default `undefined` = "Todos"). Composes
      `DashboardFiltroEjecutivo` (controlled), `DashboardKpis`, the 3 lists
      (`DashboardCotizacionesPorAprobar`, `DashboardSolicitudesSinCotizar`,
      `DashboardCotizacionesPorVencer`) in a 3-col responsive grid, and
      `CalendarioPanel` inside a `Card`/`CardContent` (design D7 — no extra
      wrapper needed, it renders its own loading/error states). Filter value
      wired to the two cotizaciones-scoped widgets and `DashboardKpis`;
      `DashboardSolicitudesSinCotizar` receives no props (area-scope,
      verified — it takes zero props per WU3/WU4 signature).
- [x] 4.2 `src/compartido/componentes/dashboard-content.tsx` — modified. Now
      a presentational shell rendering `children: ReactNode` (design D3);
      `SectionCards`/`ChartAreaInteractive` imports removed. **Deviation
      from the literal task wording**: `children` is typed **optional**
      (`children?: ReactNode`), not required. Reason: a repo-wide grep for
      `DashboardContent` consumers (not just `SectionCards`/
      `ChartAreaInteractive`, which were confirmed used only inside this
      file) surfaced a second, undocumented consumer —
      `src/app/(privado)/page.tsx` (route `/`, title "Inicio", distinct from
      `/dashboard`) — which renders `<DashboardContent />` with no children.
      This route is out of this change's scope (not mentioned in spec/
      design/tasks) and untouched by design; making `children` required
      broke its typecheck (`pnpm build` failed:
      `Property 'children' is missing in type '{}'`). Kept `children`
      optional so the shell renders nothing when omitted — preserves that
      route's existing (already-empty-looking) behavior exactly, per the
      task's own rule "if used elsewhere, do NOT break those — only change
      `dashboard-content.tsx`". No other file was touched to accommodate
      this. Also added `px-4 py-4 md:px-6 md:py-6` to the inner wrapper (the
      removed `SectionCards`/`ChartAreaInteractive` each carried their own
      `px-4 lg:px-6`; moved that spacing to the shell so children are not
      forced to know about it).
- [x] 4.3 `src/app/(privado)/dashboard/page.tsx` — modified. Renders
      `<DashboardContent><DashboardVista /></DashboardContent>` under
      `SiteHeader title="Dashboard"` — `SiteHeader` usage unchanged.
- [x] 5.1 Gate: `pnpm build` PASS, `pnpm lint` baseline unchanged (see Gate
      results below). Manual verification checklist produced (not
      performed — browser checks require a human), see below.

## Gate results (WU5 + WU6, Standard Mode, no test runner)

- `pnpm build`: **PASS** (after the `children?` fix above). Turbopack
  compiled successfully in 9.1s, TypeScript check passed in 10.7s, all
  55/55 routes generated including `/dashboard` (now server-rendered `ƒ`,
  mounting `DashboardVista`) and `/comercial/calendario`, and `/` (Inicio,
  still using the now-optional-children `DashboardContent` shell — unaffected).
- `pnpm lint`: repo-wide **1594 problems (103 errors, 1491 warnings)** —
  identical baseline to the WU3+WU4 run (same counts). Grepped the full
  lint output for the 3 files touched this run
  (`dashboard-vista.tsx`, `dashboard-content.tsx`, dashboard `page.tsx`):
  **zero matches** — zero errors, zero warnings in any file this run
  touched.

## Work Unit Evidence (WU5 + WU6)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm build` → PASS (Turbopack compiled successfully in 9.1s, TypeScript check passed in 10.7s, 55/55 routes generated, 0 errors) |
| Runtime harness command/scenario and exact result | Not performed by the agent — see "Manual verification checklist (human)" below. `pnpm lint` grepped for the 3 touched files: 0 errors, 0 warnings (repo-wide baseline unchanged at 103 errors / 1491 warnings, all pre-existing/unrelated) |
| Rollback boundary | Revert `dashboard-content.tsx` and `app/(privado)/dashboard/page.tsx` to their pre-WU5 versions (restores the `SectionCards`/`ChartAreaInteractive` placeholder on `/dashboard`); delete `src/modulos/comercial/dashboard/vistas/dashboard-vista.tsx`. `src/app/(privado)/page.tsx` (Inicio) was never modified — no rollback needed there. |

## Manual verification checklist (human — NOT performed by this agent)

Run these in a browser against a local dev/staging build with a logged-in
session that has Comercial access. The agent did not and cannot execute
these (no browser tool in this run).

**`/dashboard`**
1. Page loads under the `SiteHeader` "Dashboard" title; no console errors.
2. `DashboardFiltroEjecutivo` shows "Todos" selected by default.
3. `DashboardKpis` renders two sections (Cotizaciones, Solicitudes) with
   numeric totals — Skeleton while loading, numbers after.
4. Change the ejecutivo filter to a specific person:
   - `DashboardKpis` Cotizaciones section recalculates (numbers change or
     stay if that ejecutivo has the same counts).
   - `DashboardCotizacionesPorAprobar` and `DashboardCotizacionesPorVencer`
     lists recalculate.
   - `DashboardKpis` Solicitudes section and `DashboardSolicitudesSinCotizar`
     list do **NOT** change (area-scope, no ejecutivo filter applied).
5. `DashboardCotizacionesPorVencer` only shows cotizaciones in bucket
   `enviadas` with `fechaVencimiento` within the next 72h (cross-check
   against `/comercial/cotizaciones` filtered to `enviadas`).
6. Each list's "Ver todas" link navigates to
   `/comercial/cotizaciones?bucket=...` or
   `/comercial/solicitudes-cliente?bucket=disponibles` and the destination
   page actually applies that bucket filter (this deep-link convention was
   inferred from `*-tabla.tsx` files, not verified end-to-end — flagged in
   WU3/WU4 notes).
7. `CalendarioPanel` renders at the bottom inside a `Card`, with working
   month navigation (prev/next/today), identical to `/comercial/calendario`.
8. Open browser DevTools → Network tab, reload: confirm no query keys fire
   that don't already fire on `/comercial/cotizaciones`,
   `/comercial/solicitudes-cliente`, or `/comercial/calendario` today (no
   new endpoints, no duplicate polling).

**`/comercial/calendario`**
9. Confirm this route still renders identically to before this change
   (wrapped in `PaginaListado`, same header/breadcrumbs/chrome) — the
   `CalendarioPanel` extraction (WU2) should be behavior-invisible here.

**`/` (Inicio) — regression check (not in original scope, surfaced during WU5/WU6)**
10. Confirm `/` still loads without a blank crash — it renders
    `DashboardContent` with no children (now optional), so the content area
    below `SiteHeader` will legitimately appear empty. Confirm this was
    already effectively the case before this change (it previously showed
    the `SectionCards`/`ChartAreaInteractive` demo placeholder, which is now
    gone from this shell instance only) — flag to product/design if `/`
    should get its own real content in a follow-up change.

## Historical notes (written after WU3+WU4, kept for audit trail — all resolved in WU5+WU6)

- All 6 widgets from WU3/WU4 were composed as planned in `DashboardVista`
  (4.1): `idEjecutivoResponsable` as `useState<IdEjecutivoFiltro>` (default
  `undefined` = "Todos"), passed down to `DashboardKpis`,
  `DashboardCotizacionesPorAprobar`, and `DashboardCotizacionesPorVencer`.
  `DashboardSolicitudesSinCotizar` takes no props (area-scope by design —
  confirmed unchanged).
- `CalendarioPanel` (from WU2) is mounted directly inside a `Card` in
  `DashboardVista`, per design D7 — no wrapper needed.
- `dashboard-content.tsx` (4.2) became a `children`-based shell per design
  D3 — with one deviation from the literal plan: `children` had to be typed
  **optional**, not required, because a second undocumented consumer
  (`src/app/(privado)/page.tsx`, route "Inicio") was discovered only via
  `pnpm build` failing after the first attempt. See the WU5+WU6 "Done"
  section above for full detail.
- Deep-link targets used by the 3 specific lists (`?bucket=...` query params
  on `/comercial/cotizaciones` and `/comercial/solicitudes-cliente`) remain
  **not verified end-to-end** by this agent — added to the human manual
  verification checklist above (item 6) for WU6's gate.

## Change status: COMPLETE (WU1-WU6, all 15 tasks `[x]`)
