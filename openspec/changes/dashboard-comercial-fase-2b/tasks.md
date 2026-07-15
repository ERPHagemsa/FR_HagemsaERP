# Tareas: Dashboard Comercial — Fase 2b (recableado a los 8 endpoints de BC03)

> Recablea `/comercial` para consumir los 8 endpoints reales de agregación de BC03
> Fase 2 en vez de componer hooks de resumen/listado de Cotizaciones y Solicitudes.
> Orden por dependencia: tríada de datos → compartidos (dinero/paleta/período) →
> widgets → wiring de vista + retiro de deuda Fase 1 → gate. Entrega: commits
> directos a `desarrollo`, sin PRs (misma convención que Fase 1). Sin test runner
> en el repo (confirmado: sin `vitest`/`jest`, sin `*.test.tsx`/`*.spec.tsx` en
> `src/`, sin script `test` en `package.json`; `@playwright/test` está como
> devDependency pero sin `playwright.config.*` ni carpeta `e2e/` — no configurado).
> Gate = `pnpm build` + `pnpm lint` + verificación manual, igual que Fase 1 y como
> ya lo fija `design.md` §Testing strategy. Por eso este plan NO empareja cada
> tarea de implementación con una tarea de test automatizado (no hay convención
> de testing de componentes que seguir en este repo); en su lugar, cada widget
> lleva su propia verificación manual dentro del gate final (5.2).

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~950-1050 (2 archivos nuevos de tríada + 1 tipos extendido + 1 claves-consulta + 6 archivos compartidos/tema + 8 widgets nuevos + 1 vista modificada + 5 archivos retirados) |
| 400-line budget risk | High (total del change) — cada Work Unit individual queda por debajo de ~250 líneas |
| Chained PRs recommended | Yes |
| Suggested split | WU1 tríada de datos → WU2 compartidos (dinero/paleta/período) → WU3 widgets dinero/tasas → WU4 widgets series/ranking → WU5 widgets embudo/acciones → WU6 wiring + retiro de deuda Fase 1 → WU7 gate |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main (adaptado: el repo no usa PRs; cada WU es un commit atómico que aterriza en orden sobre `desarrollo`, equivalente funcional a stacked-to-main sin envoltorio de PR) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Tríada de acceso a datos: tipos + claves + api + queries (1.1-1.4) | WU1 (commit) | `pnpm build` | N/A — sin UI todavía | Revertir `dashboard.tipos.ts`; borrar `dashboard-{api,queries}.ts`; revertir `claves-consulta.ts` |
| 2 | Compartidos: dinero, delta monetario, paleta dataviz, selector de período (2.1-2.5) | WU2 (commit) | `pnpm build` | Inspección visual de la paleta en claro/oscuro (Storybook no disponible: montar `DashboardSelectorPeriodo` en una ruta de prueba o revisar en navegador tras WU6) | Revertir `formato-moneda.ts` (restaurar `formatearMoneda` local en `lineas-grid.utils.ts`); revertir CSS vars de `globals.css`; borrar `dashboard-selector-periodo.tsx` y el helper de delta |
| 3 | Widgets de dinero y tasas: KPI dinero, win rate, ciclo de cierre (3.1-3.3) | WU3 (commit) | `pnpm build` | N/A — aún no montados en ruta | Borrar los 3 componentes de `dashboard/componentes/` |
| 4 | Widgets de series y ranking: tendencia, ranking, motivos de pérdida (3.4-3.6) | WU4 (commit) | `pnpm build` | N/A — aún no montados en ruta | Borrar los 3 componentes de `dashboard/componentes/` |
| 5 | Widgets de embudo y acciones (3.7-3.8) | WU5 (commit) | `pnpm build` | N/A — aún no montados en ruta | Borrar los 2 componentes de `dashboard/componentes/` |
| 6 | Wiring de `DashboardVista` + retiro de deuda Fase 1 (4.1-4.2) | WU6 (commit) | `pnpm build` | Navegar `/comercial` manualmente contra BC03 corriendo | Revertir `dashboard-vista.tsx`; restaurar `dashboard-kpis.tsx`, las 3 listas Fase 1 y `utilidades/por-vencer.ts` desde el commit anterior |
| 7 | Gate final: build + lint + verificación manual completa (5.1-5.2) | WU7 (commit) | `pnpm build && pnpm lint` | Checklist manual en navegador contra BC03 corriendo (ver 5.2) | N/A — sin cambios de código |

## 1. Tríada de acceso a datos (`dashboard-api` / `dashboard-queries` / tipos)

- [x] 1.1 Extender `src/modulos/comercial/dashboard/tipos/dashboard.tipos.ts`:
      **levantar el guardrail Fase 1** (ya no prohíbe `monto*`/`winRate*`, D1/D8) y
      agregar los tipos de respuesta espejo EXACTO de los DTOs de BC03 (D2):
      `TotalPorMoneda`, `ResumenDineroPorEstado`, `KpisMonetariosRespuesta`
      (`{ actual, variacionVsMesAnterior }`), `WinRateRespuesta`,
      `CicloCierreRespuesta`, `PuntoTendenciaMensual` (array pelado),
      `RankingEjecutivoRespuesta` (array pelado, campos exactos `ejecutivoId`,
      `ejecutivoNombre`, `ganado`, `pipeline`, `cantidadGanadas`,
      `cantidadCerradas`, `winRate` — gap #3), `MotivosPerdidaRespuesta`,
      `EmbudoConversionRespuesta`, `AccionPendiente` + `AccionesPendientesRespuesta`,
      y `RangoPeriodo = { desde?: string; hasta?: string }` (estado del selector
      global, D5). Conservar `IdEjecutivoFiltro`, `DashboardFiltroEjecutivoProps`,
      `DashboardListaAccionableProps`, `DashboardItemAccionable` (D4); NO tocar
      todavía los tipos que solo sirven a los componentes de conteo (se retiran en
      4.2, junto con esos componentes). Comentar el origen de cada tipo (`// espejo
      de <Resultado>, BC03 <use-case>.ts`). Soporta: design D1/D2; base de 1.3, 1.4
      y de todos los widgets de la sección 3.
- [x] 1.2 Agregar 8 constantes a `src/modulos/comercial/claves-consulta.ts` bajo la
      convención `"comercial/dashboard/<recurso>"` (D3): `CLAVE_DASHBOARD_KPIS`,
      `CLAVE_DASHBOARD_WIN_RATE`, `CLAVE_DASHBOARD_CICLO`,
      `CLAVE_DASHBOARD_TENDENCIA`, `CLAVE_DASHBOARD_RANKING`,
      `CLAVE_DASHBOARD_MOTIVOS`, `CLAVE_DASHBOARD_EMBUDO`,
      `CLAVE_DASHBOARD_ACCIONES`. Soporta: design D3; base de 1.4.
- [x] 1.3 Crear `src/modulos/comercial/dashboard/servicios/dashboard-api.ts` con 8
      funciones raw `clienteComercial.get<T>()`, una por endpoint, espejando el
      estilo de `cotizaciones-api.ts:30-49` (params opcionales, axios omite
      `undefined` del query string): `obtenerKpisMonetarios`, `obtenerWinRate`,
      `obtenerCicloCierre` (los 3 con `{ desde?, hasta?, idEjecutivoResponsable? }`
      → `GET /dashboard/kpis-monetarios|win-rate|ciclo-cierre`),
      `obtenerTendenciaMensual` (`{ idEjecutivoResponsable?, meses? }`, **sin**
      `desde`/`hasta` → `GET /dashboard/tendencia-mensual`, D6),
      `obtenerRankingEjecutivos` (`{ desde?, hasta? }`, **sin** ejecutivo →
      `GET /dashboard/ranking-ejecutivos`, restricción verificada), `obtenerMotivosPerdida`
      y `obtenerEmbudoConversion` (`{ desde?, hasta?, idEjecutivoResponsable? }` →
      `GET /dashboard/motivos-perdida|embudo-conversion`), y
      `obtenerAccionesPendientes` (`{ idEjecutivoResponsable? }`, sin período →
      `GET /dashboard/acciones-pendientes`). Soporta: design D1; spec "Composición
      vía tríada dedicada de endpoints, sin cambios de backend".
- [x] 1.4 Crear `src/modulos/comercial/dashboard/servicios/dashboard-queries.ts` con
      8 hooks `useConsulta`, cada uno con su `clave` de 1.2 y `deps` derivadas de
      sus filtros (patrón `[JSON.stringify(filtros)]`): `useKpisMonetariosQuery`,
      `useWinRateQuery`, `useCicloCierreQuery` (deps `{ periodo, idEjecutivoResponsable }`),
      `useTendenciaMensualQuery` (deps `{ idEjecutivoResponsable, meses }` — **sin**
      `periodo` en deps, D6), `useRankingEjecutivosQuery` (deps `{ periodo }` —
      **sin** `idEjecutivoResponsable` en deps ni en la llamada, restricción
      verificada), `useMotivosPerdidaQuery`, `useEmbudoConversionQuery` (deps
      `{ periodo, idEjecutivoResponsable }`), `useAccionesPendientesQuery` (deps
      `{ idEjecutivoResponsable }` — sin período). Ninguno dispara
      `invalidarConsulta` (slice solo lectura, D3). Soporta: design D1/D3/D5/D6;
      spec "Estados de carga y error independientes por widget" (una instancia de
      `useConsulta` por widget); base de todos los widgets de la sección 3.

## 2. Compartidos: dinero, paleta dataviz y selector de período

- [x] 2.1 Crear `src/compartido/utilidades/formato-moneda.ts` con
      `formatearMoneda(monto: number, moneda: "PEN" | "USD"): string` promovido
      desde `cotizaciones/componentes/lineas-grid.utils.ts:72-80` (mismo output:
      `S/`/`US$` + `toLocaleString("es-PE")`, 2 decimales). Modificar
      `src/modulos/comercial/cotizaciones/componentes/lineas-grid.utils.ts` para
      re-importar `formatearMoneda` desde el nuevo módulo compartido en vez de
      declararlo local (cambio mecánico, sin alterar el output). Soporta: design D9.
- [x] 2.2 Crear un helper puro de delta monetario en
      `src/modulos/comercial/dashboard/utilidades/delta-monetario.ts` (p. ej.
      `calcularDeltaMonetario(actual: TotalPorMoneda, anterior: TotalPorMoneda): TotalPorMoneda`
      que resta `actual − anterior` por moneda, PEN y USD por separado, sin
      convertir). Encapsula la asimetría documentada en D12: a diferencia de
      `win-rate`/`ciclo-cierre` (delta ya calculado por backend, consumido
      directo), `kpis-monetarios` solo expone los valores crudos del período
      anterior en `variacionVsMesAnterior` y el frontend deriva el delta. Soporta:
      design D12; spec "Franja de KPI monetarios (PEN/USD)" — escenario "Variación
      derivada por el frontend"; consumido por 3.1.
- [x] 2.3 Agregar la paleta dataviz como CSS custom properties en
      `src/app/globals.css` (bloques `:root` y `.dark`, junto a las `--chart-*`
      existentes), siguiendo el patrón `--color-x` que `ChartConfig` mapea:
      `--dataviz-teal` (`#0d9488` claro / `#2dd4bf` oscuro), `--dataviz-rose`
      (`#e11d48` claro / `#fb7185` oscuro), `--dataviz-amber` (`#d97706` claro /
      `#fbbf24` oscuro). Soporta: design D8; spec (implícito en todos los
      widgets con gráfica, sección 3); mitiga riesgo #1 del proposal.
- [x] 2.4 Validar el contraste WCAG AA de cada par teal/rose/amber (claro y
      oscuro) contra el token de fondo de `Card` usado por los widgets; ajustar
      los hex de `.dark` en `globals.css` (2.3) si algún par no alcanza AA.
      Documentar el resultado (par validado / hex final) en un comentario junto a
      las CSS vars. Soporta: design D8 ("se debe validar el contraste real...
      antes de fijar los hex"); Open Question de design.md sobre hex definitivos
      de la paleta oscura; mitiga riesgo #1 del proposal.
- [x] 2.5 Crear `src/modulos/comercial/dashboard/componentes/dashboard-selector-periodo.tsx`:
      componente controlado (props `periodo: RangoPeriodo`,
      `alCambiar: (periodo: RangoPeriodo) => void`, sin estado propio, mismo
      patrón que `DashboardFiltroEjecutivo`) con 4 botones-preset ("Este mes" /
      "Mes anterior" / "Últimos 3 meses" / "Este año", cada uno calcula
      `desde`/`hasta` ISO en cliente) **más** un rango custom (desde/hasta)
      construido sobre `Popover` (`@/compartido/componentes/ui/popover`) +
      `Calendar` en `mode="range"` (`@/compartido/componentes/ui/calendar` — ya
      soporta selección de rango vía `range_start`/`range_middle`/`range_end`, no
      se detectó ningún selector de rango de fechas existente en el repo para
      reusar, así que se construye sobre estas dos primitivas shadcn ya
      disponibles). Alimenta a `kpis-dinero`, `win-rate`, `ciclo-cierre`,
      `ranking`, `motivos-perdida` y `embudo`; **no** afecta a `tendencia` ni a
      `acciones` (D6, restricción verificada — el componente no las conoce, solo
      expone `periodo`). Soporta: spec "Selector global de período"; design D5/D6.

## 3. Widgets de presentación del dashboard

- [x] 3.1 Crear `src/modulos/comercial/dashboard/componentes/dashboard-kpis-dinero.tsx`:
      consume `useKpisMonetariosQuery({ periodo, idEjecutivoResponsable })`;
      franja de tarjetas Ganado / Pipeline / Ticket promedio, PEN y USD **en
      líneas separadas, nunca sumados ni convertidos** (usa `formatearMoneda` de
      2.1); delta de cada monto calculado con `calcularDeltaMonetario` (2.2)
      comparando `actual` vs `variacionVsMesAnterior`; `ticketPromedio` en `0` (no
      `null`) se renderiza como `0`, no como "sin datos" (zero-data por
      construcción del backend); estados `Skeleton`/`Alert` por widget (D10).
      Soporta: spec "Franja de KPI monetarios (PEN/USD)" (los 3 escenarios);
      design D4/D9/D12.
- [x] 3.2 Crear `src/modulos/comercial/dashboard/componentes/dashboard-win-rate.tsx`:
      consume `useWinRateQuery({ periodo, idEjecutivoResponsable })`; tarjeta con
      `%` + donut `PieChart`/`Pie innerRadius` (2 sectores ganadas/perdidas, vía
      `ChartContainer`/`ChartConfig` de `@/compartido/componentes/ui/chart`,
      colores `var(--dataviz-teal)`/`var(--dataviz-rose)` de 2.3) y
      `variacionVsMesAnterior` en puntos porcentuales; `winRate: null` y
      `variacionVsMesAnterior: null` renderizan un estado "sin datos" neutro (sin
      donut, sin tratarlo como error). Soporta: spec "KPI de win rate del
      período" (los 3 escenarios); design D4/D7/D8/D12.
- [x] 3.3 Crear `src/modulos/comercial/dashboard/componentes/dashboard-ciclo-cierre.tsx`:
      consume `useCicloCierreQuery({ periodo, idEjecutivoResponsable })`; tile
      numérico "N días" + indicador de `variacionVsMesAnterior` coloreado con la
      convención **"menos es mejor"** (delta negativo = mejora = verde/teal;
      delta positivo = deterioro = rojo/rose — el signo crudo del backend no se
      invierte, solo se colorea distinto); `cicloPromedioDias`/`variacionVsMesAnterior`
      en `null` renderizan "sin datos" neutro. Soporta: spec "KPI de ciclo de
      cierre del período" (los 4 escenarios); design D4/D12; mitiga riesgo #4 del
      proposal.
- [x] 3.4 Crear `src/modulos/comercial/dashboard/componentes/dashboard-tendencia.tsx`:
      consume `useTendenciaMensualQuery({ idEjecutivoResponsable })` — **sin**
      prop `periodo`, no la recibe de `DashboardVista` (D6); `BarChart` agrupado
      con 2 `Bar` (ganado/perdido) por mes, eje X `${mes}/${anio}`, colores
      `var(--dataviz-teal)`/`var(--dataviz-rose)`; renderiza los 6 puntos de la
      ventana tal cual llegan (meses en `0` se muestran, no se omiten). Soporta:
      spec "Tendencia mensual ganado vs. perdido" (los 2 escenarios); design
      D4/D6/D7.
- [x] 3.5 Crear `src/modulos/comercial/dashboard/componentes/dashboard-ranking.tsx`:
      consume `useRankingEjecutivosQuery({ periodo })` — **sin** prop de
      ejecutivo, siempre equipo completo (restricción verificada, endpoint
      ignora `idEjecutivoResponsable`); tabla (`Table`) ordenada por
      `ganado.pen` descendente con columnas ejecutivo, ganado (PEN/USD vía 2.1),
      win rate (`null`-safe → "sin datos", no `0%`) y "Cotiz." = `cantidadCerradas`
      (gap #3). Soporta: spec "Ranking de ejecutivos" (los 3 escenarios); design
      D4/gap #3.
- [x] 3.6 Crear `src/modulos/comercial/dashboard/componentes/dashboard-motivos-perdida.tsx`:
      consume `useMotivosPerdidaQuery({ periodo, idEjecutivoResponsable })`;
      `BarChart layout="vertical"` (barras horizontales) por `motivoOriginal` ×
      `cantidad`, color `var(--dataviz-amber)`; lista vacía renderiza estado
      vacío sin error; sin presentar la lista como taxonomía cerrada. Soporta:
      spec "Motivos de pérdida del período" (los 2 escenarios); design D4/D7/D8.
- [x] 3.7 Crear `src/modulos/comercial/dashboard/componentes/dashboard-embudo.tsx`:
      consume `useEmbudoConversionQuery({ periodo, idEjecutivoResponsable })`;
      4 barras decrecientes solicitud → cotizada → enviada → ganada (semántica
      "alcanzó en algún momento", conteos monótonamente decrecientes). Soporta:
      spec "Embudo de conversión del período" (los 2 escenarios); design D4/D7.
- [x] 3.8 Crear `src/modulos/comercial/dashboard/componentes/dashboard-acciones.tsx`:
      consume `useAccionesPendientesQuery({ idEjecutivoResponsable })` — sin
      período; 3 columnas reusando `DashboardListaAccionable` (Por vencer 72h /
      Esperando aprobación / Sin cotizar) mapeando `AccionPendiente[]` a
      `DashboardItemAccionable[]`; `solicitudesSinCotizar` no varía con el filtro
      de ejecutivo (siempre `idEjecutivoResponsable: null`, invariante de
      dominio); sin cálculo de negocio en cliente (la regla de 72h ya viene
      resuelta). Soporta: spec "Acciones pendientes (listas accionables)" (los 4
      escenarios); design D4/D11.

## 4. Wiring de la vista y retiro de deuda Fase 1

- [x] 4.1 Modificar `src/modulos/comercial/dashboard/vistas/dashboard-vista.tsx`:
      agregar `useState<RangoPeriodo>` para `periodo` (junto al
      `idEjecutivoResponsable` existente); renderizar `DashboardSelectorPeriodo`
      (2.5) como hermano de `DashboardFiltroEjecutivo`; reemplazar `DashboardKpis`
      por `DashboardKpisDinero` (3.1); agregar los 7 widgets restantes de la
      sección 3 con la propagación de props exacta de design D5: `kpis-dinero` /
      `win-rate` / `ciclo-cierre` / `motivos-perdida` / `embudo` reciben
      `{ periodo, idEjecutivoResponsable }`; `ranking` recibe solo `{ periodo }`;
      `tendencia` recibe solo `{ idEjecutivoResponsable }`; `acciones` recibe
      solo `{ idEjecutivoResponsable }`. Soporta: spec "Selector global de
      período", "Filtro global de ejecutivo (Todos / uno)" (todos los escenarios
      de recálculo/exención); design D4/D5/D6.
- [x] 4.2 Retirar la deuda y los componentes de conteo Fase 1: borrar
      `src/modulos/comercial/dashboard/componentes/dashboard-kpis.tsx`,
      `dashboard-cotizaciones-por-aprobar.tsx`, `dashboard-solicitudes-sin-cotizar.tsx`,
      `dashboard-cotizaciones-por-vencer.tsx` y
      `src/modulos/comercial/dashboard/utilidades/por-vencer.ts` (deuda Fase 1
      saldada, D11); eliminar de `dashboard.tipos.ts` los tipos de presentación
      que solo servían a esos componentes de conteo (`DashboardKpisProps`,
      `DashboardListaEspecificaProps` si ya no tienen otro consumidor tras 4.1).
      Verificar que ningún import residual referencie los archivos borrados.
      Soporta: proposal "Retirar `utilidades/por-vencer.ts`"; design D4/D11;
      spec "Acciones pendientes (listas accionables)" (nota de reemplazo).

## 5. Verificación final (gate del proyecto: sin test runner)

- [x] 5.1 Ejecutar `pnpm build` y `pnpm lint` sobre el estado final del change;
      corregir errores de tipos y warnings de lint del código nuevo/modificado
      (tríada de datos, compartidos, 8 widgets, vista, archivos retirados).
      Soporta: `openspec/config.yaml` — `rules.verify`; proposal "Success
      Criteria" — "`pnpm build` + `pnpm lint` en verde".
- [ ] 5.2 (pendiente de verificación manual del usuario contra BC03 corriendo — fuera
      del alcance del agente, ver nota en apply-progress.md) Verificar manualmente en navegador contra BC03 corriendo (checklist de
      design.md §Testing strategy): cambiar ejecutivo recalcula kpis-dinero /
      win-rate / ciclo / tendencia / motivos / embudo / acciones, **ranking NO
      cambia**; cambiar período recalcula kpis-dinero / win-rate / ciclo /
      ranking / motivos / embudo, **tendencia y acciones NO cambian**; KPI de
      dinero muestran PEN y USD separados, nunca sumados/convertidos; `winRate` /
      `cicloPromedioDias` en `null` renderizan "sin datos", no "0"; delta de
      ciclo negativo se ve verde (menos es mejor), positivo se ve rojo; paleta
      dataviz legible en claro y oscuro (inspección visual, tras 2.4); forzar un
      error en un endpoint (p. ej. cortar red a `motivos-perdida`) y confirmar
      que solo ese widget degrada, los demás siguen mostrando datos. Soporta:
      proposal "Success Criteria" (todos los ítems); spec "Estados de carga y
      error independientes por widget"; design §Testing strategy.

## Notas

- **Sin test runner en el repo** (verificado: sin `vitest.config.*` ni
  `jest.config.*`, cero `*.test.tsx`/`*.spec.tsx` bajo `src/`, sin script
  `"test"` en `package.json`; `@playwright/test` es una devDependency sin
  `playwright.config.*` ni carpeta `e2e/` — no está configurado como harness).
  Por eso este plan sigue el gate real del proyecto (`pnpm build` + `pnpm lint` +
  verificación manual, igual que Fase 1) en vez de emparejar cada tarea de
  implementación con una tarea de test automatizado.
- **Deltas asimétricos (D12)**: `win-rate` y `ciclo-cierre` traen
  `variacionVsMesAnterior` ya calculado por backend (consumo directo, tareas 3.2
  y 3.3); `kpis-monetarios` trae los valores crudos del período anterior y el
  delta se calcula en cliente con el helper de 2.2 (tarea 3.1) — una sola
  llamada, sin doble fetch.
- **Ranking siempre de equipo completo**: el endpoint ignora
  `idEjecutivoResponsable` (verificado contra el use case, no solo el DTO); la
  tarea 3.5 no le pasa ese filtro y ordena por `ganado.pen` descendente; "Cotiz."
  mapea a `cantidadCerradas`.
- **Ciclo de cierre "menos es mejor"**: el backend da el delta crudo sin
  invertir signo; el frontend (tarea 3.3) es responsable de colorear negativo =
  mejora, positivo = deterioro.
- **`utilidades/por-vencer.ts` se retira** (tarea 4.2): la única deuda de
  negocio en cliente de Fase 1 queda saldada por `acciones-pendientes.porVencer72h`.
- **`formatearMoneda` se promueve** a `src/compartido/utilidades/formato-moneda.ts`
  (tarea 2.1); el call-site de Cotizaciones re-importa desde ahí, mismo output.
- **Cero cambios de backend/proxy/auth**: todos los endpoints y el BFF
  `/api/comercial` ya existen; ninguna tarea de este plan los toca.
