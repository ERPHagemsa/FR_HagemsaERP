# Design — Dashboard Comercial Fase 2b (frontend rewire a los 8 endpoints de BC03)

## Context

El slice `dashboard` (`src/modulos/comercial/dashboard`) es feature-first como el
resto del módulo Comercial: `tipos/`, `componentes/`, `vistas/`. Fase 1 lo montó
como una capa de **composición y solo presentación** (design Fase 1, D1/D8): sin
`servicios/`, reusando los hooks de resumen/listado de Cotizaciones y Solicitudes,
con un guardrail explícito que **prohíbe** identificadores `monto*`/`winRate*` en
`tipos/dashboard.tipos.ts`.

Fase 2 cerró en BC03: hay **8 endpoints de agregación** bajo `/dashboard/*`
(`dashboard.controller.ts:19-79`), todos con `@RequirePermission('bc03:dashboard:leer')`.
Este change **recablea** el frontend para consumirlos y renderizar el dashboard
decision-grade del mockup: dinero PEN/USD, win rate, ciclo de cierre, tendencia,
ranking, motivos de pérdida, embudo y acciones pendientes.

Patrón de datos a seguir (verificado en repo):
- `useConsulta<T>(fn, deps, { enabled?, clave? })` — sin cache compartido, cancela
  al cambiar deps vía contador de generación, e invalidación por `clave`
  (`src/compartido/api/use-consulta.ts:66-142`).
- Tríada per-BC: `<recurso>-api.ts` (raw `clienteComercial.get<T>()`) +
  `<recurso>-queries.ts` (hooks `useConsulta`, `clave` desde `claves-consulta.ts`) +
  `tipos/<recurso>.tipos.ts` (`cotizaciones-api.ts:30-49`, `cotizaciones-queries.ts:57-74`).
- `clienteComercial` → BFF `/api/comercial` que inyecta `Authorization: Bearer`
  server-side (`clientes-backend.ts:73`). **Cero trabajo de auth en frontend.**
- Gráficas: recharts 3.8.0 (ya dependencia), patrón `ChartConfig` + `var(--color-x)`
  (`chart-area-interactive.tsx:129-141,211-281`).

Sin test runner (Standard Mode). Gate: `pnpm build` + `pnpm lint`.

## Restricción verificada (condiciona el diseño)

Confirmado contra el código de BC03 (no contra la doc), endpoint por endpoint, qué
filtro **realmente** aplica cada use case:

| Endpoint | Query DTO | período (`desde`/`hasta`) | ejecutivo (`idEjecutivoResponsable`) |
|---|---|---|---|
| `kpis-monetarios` | `DashboardPeriodoDto` | **Sí** | **Sí** |
| `win-rate` | `DashboardPeriodoDto` | **Sí** | **Sí** |
| `ciclo-cierre` | `DashboardPeriodoDto` | **Sí** | **Sí** |
| `tendencia-mensual` | `TendenciaMensualQueryDto` (+`meses?`) | **No** (ventana `meses`) | **Sí** |
| `ranking-ejecutivos` | `DashboardPeriodoDto` | **Sí** | **No** (el use case lo ignora) |
| `motivos-perdida` | `DashboardPeriodoDto` | **Sí** | **Sí** |
| `embudo-conversion` | `DashboardPeriodoDto` | **Sí** | **Sí** |
| `acciones-pendientes` | `AccionesPendientesQueryDto` | **No** | **Sí** |

Matices no obvios (verificados en el use case, no en el DTO):
- `ranking-ejecutivos`: el DTO **acepta** `idEjecutivoResponsable`, pero
  `ObtenerRankingEjecutivosUseCase` solo pasa `rango` a `sumarDineroPorEjecutivo(rango)`
  (`obtener-ranking-ejecutivos.use-case.ts:25`) — nunca el ejecutivo. El ranking es
  **siempre de todo el equipo**; filtrarlo por ejecutivo no tendría sentido. El
  frontend NO le pasa el filtro de ejecutivo.
- `tendencia-mensual`: **sí** honra el filtro de ejecutivo (lo propaga al repo,
  `obtener-tendencia-mensual.use-case.ts:49`), pero **no** el período — usa su propia
  ventana `meses` (default 6). Gap #4.
- `acciones-pendientes`: honra ejecutivo (`listar-acciones-pendientes.use-case.ts:16`),
  no tiene período.

## Decisions

### D1 — Reversión documentada: el slice `dashboard` estrena su tríada `api/queries/tipos`

Fase 1 deliberadamente **no** tuvo `servicios/` (design Fase 1, D1) como barrera
estructural anti-agregación-en-cliente. Fase 2b **revierte esa decisión de forma
explícita**: la agregación ahora vive en BC03, así que el slice necesita su propia
capa de acceso. Se crean:

- `servicios/dashboard-api.ts` — 8 funciones raw, una por endpoint, cada una
  `clienteComercial.get<T>("/dashboard/<x>", { params })`, espejando exactamente el
  estilo de `cotizaciones-api.ts:30-49` (params opcionales, axios omite `undefined`
  del query string).
- `servicios/dashboard-queries.ts` — 8 hooks `useConsulta`, cada uno con su `clave` y
  con `deps` derivadas de los filtros (patrón `[JSON.stringify(filtros)]` de
  `cotizaciones-queries.ts:57-63`, o deps escalares cuando el filtro es plano).
- `tipos/dashboard.tipos.ts` — se **levanta el guardrail Fase 1** (D8) y se agregan los
  tipos de respuesta (D2). Los tipos de presentación de Fase 1 que sigan vivos
  (`IdEjecutivoFiltro`, `DashboardListaAccionableProps`, `DashboardItemAccionable`) se
  conservan; los ligados a `DashboardKpis` de conteos se retiran con el componente.

**Descartado** meter la agregación en un barrel de re-export sobre los hooks viejos
(no hay dato que reusar: los endpoints son nuevos) y **descartado** consumir
`clienteComercial` directo desde los componentes (rompe la tríada per-BC y esparce
llamadas de red por la capa de vista).

### D2 — Tipos de respuesta espejo EXACTO de los DTOs de BC03

`tipos/dashboard.tipos.ts` declara los tipos de respuesta con los **mismos nombres de
campo** que retornan los use cases (verificado contra `dashboard.repository.ts:5-76` y
los 8 `*.use-case.ts`). Tipo base compartido:

```ts
type TotalPorMoneda = { pen: number; usd: number };   // dashboard.repository.ts:5-8
```

| Endpoint | Tipo de respuesta (campos EXACTOS) |
|---|---|
| `kpis-monetarios` | `{ actual: ResumenDineroPorEstado; variacionVsMesAnterior: ResumenDineroPorEstado }` donde `ResumenDineroPorEstado = { ganado: TotalPorMoneda; pipeline: TotalPorMoneda; ticketPromedio: TotalPorMoneda }` |
| `win-rate` | `{ ganadas: number; perdidas: number; winRate: number \| null; variacionVsMesAnterior: number \| null }` |
| `ciclo-cierre` | `{ cicloPromedioDias: number \| null; variacionVsMesAnterior: number \| null }` |
| `tendencia-mensual` | `Array<{ anio: number; mes: number; ganado: TotalPorMoneda; perdido: TotalPorMoneda }>` (array pelado) |
| `ranking-ejecutivos` | `Array<{ ejecutivoId: string; ejecutivoNombre: string; ganado: TotalPorMoneda; pipeline: TotalPorMoneda; cantidadGanadas: number; cantidadCerradas: number; winRate: number \| null }>` (array pelado) |
| `motivos-perdida` | `{ motivos: Array<{ motivoNormalizado: string; motivoOriginal: string; cantidad: number }> }` |
| `embudo-conversion` | `{ solicitud: number; cotizada: number; enviada: number; ganada: number }` (contadores "ever-reached", acumulativos) |
| `acciones-pendientes` | `{ porVencer72h: AccionPendiente[]; esperandoAprobacion: AccionPendiente[]; solicitudesSinCotizar: AccionPendiente[] }` donde `AccionPendiente = { id: string; referencia: string; idEjecutivoResponsable: string \| null; nombreEjecutivoResponsable: string \| null; moneda: "PEN" \| "USD" \| null; monto: number \| null }` |

Reglas de tipado a respetar:
- `winRate` y `cicloPromedioDias` son **`null`-safe** (cero datos → `null`, no cero) —
  el render debe distinguir "sin datos" de "0 %".
- `tendencia-mensual` y `ranking-ejecutivos` devuelven **arrays pelados** (sin envelope
  `{ data }`), igual que `obtenerEjecutivosCotizaciones` (`cotizaciones-api.ts:75-80`).
- `moneda` del embudo/acciones puede ser `null` (solicitud sin cotizar → sin monto).
- El tipo `IdEjecutivoFiltro = string | undefined` de Fase 1 se conserva
  (`dashboard.tipos.ts:15`).

**Descartado** reusar/derivar tipos importando de BC03 (repos separados, sin paquete
compartido) — se replican a mano y se comenta el origen (`// espejo de
KpisMonetariosResultado, BC03 obtener-kpis-monetarios.use-case.ts`).

### D3 — Una `clave` de consulta por endpoint en `claves-consulta.ts`

Se agregan 8 constantes a `src/modulos/comercial/claves-consulta.ts` bajo la
convención existente `"comercial/<recurso>"` (`claves-consulta.ts:5-30`):

```
CLAVE_DASHBOARD_KPIS         = "comercial/dashboard/kpis-monetarios"
CLAVE_DASHBOARD_WIN_RATE     = "comercial/dashboard/win-rate"
CLAVE_DASHBOARD_CICLO        = "comercial/dashboard/ciclo-cierre"
CLAVE_DASHBOARD_TENDENCIA    = "comercial/dashboard/tendencia-mensual"
CLAVE_DASHBOARD_RANKING      = "comercial/dashboard/ranking-ejecutivos"
CLAVE_DASHBOARD_MOTIVOS      = "comercial/dashboard/motivos-perdida"
CLAVE_DASHBOARD_EMBUDO       = "comercial/dashboard/embudo-conversion"
CLAVE_DASHBOARD_ACCIONES     = "comercial/dashboard/acciones-pendientes"
```

Clave separada por widget: cada `useConsulta` tiene su propio estado/fetch y refetchea
con sus deps (patrón `useConsulta`). Son **solo lectura**: no hay mutaciones en este
slice, así que ninguna `invalidarConsulta` se dispara desde aquí (a diferencia de
Cotizaciones). Las claves existen por consistencia con el patrón y por si una acción
futura (marcar ganada/perdida) quisiera invalidar el dashboard cross-tree.

### D4 — Árbol de componentes: qué se conserva, qué se reemplaza, qué es nuevo

**Se conserva** (shell Fase 1):
- `vistas/dashboard-vista.tsx` — sigue siendo el orquestador (extendido en D5).
- `componentes/dashboard-filtro-ejecutivo.tsx` — filtro global de ejecutivo, sin cambios
  de contrato (`DashboardFiltroEjecutivoProps`).
- `componentes/dashboard-lista-accionable.tsx` — presentacional genérico de lista;
  se **reusa** para las 3 listas del widget de acciones (D2), extendiendo
  `DashboardItemAccionable` con `monto`/`moneda` opcionales para la referencia monetaria.

**Se reemplaza**:
- `componentes/dashboard-kpis.tsx` (franja de conteos all-time) → se retira y se sustituye
  por el widget de KPI monetarios (abajo). Se eliminan también los tipos de presentación
  que solo servían a los conteos.
- Las 3 listas concretas Fase 1 (`dashboard-cotizaciones-por-aprobar`,
  `dashboard-solicitudes-sin-cotizar`, `dashboard-cotizaciones-por-vencer`) dejan de
  fetchear vía hooks de Cotizaciones/Solicitudes y pasan a alimentarse de las 3 listas de
  `acciones-pendientes` (un solo `useConsulta`, tres columnas). Se colapsan en el widget
  de acciones (abajo).

**Nuevos componentes** (uno por widget, cada uno con su `useConsulta`):

| Componente | Endpoint | Render |
|---|---|---|
| `dashboard-kpis-dinero.tsx` | `kpis-monetarios` | Franja de tarjetas: Ganado, Pipeline, Ticket promedio — **PEN y USD en líneas separadas, nunca sumados** (D9). Delta de dinero calculado en cliente desde `actual` vs `variacionVsMesAnterior` (D12). |
| `dashboard-win-rate.tsx` | `win-rate` | Tarjeta con % + donut (`PieChart` con `innerRadius`), ganadas/perdidas, y `variacionVsMesAnterior` en puntos porcentuales. |
| `dashboard-ciclo-cierre.tsx` | `ciclo-cierre` | Tile numérico "N días" + delta coloreado con convención "menos es mejor" (D12). |
| `dashboard-tendencia.tsx` | `tendencia-mensual` | `BarChart` agrupado ganado vs perdido por mes (D7). **No recibe período** (D6). |
| `dashboard-ranking.tsx` | `ranking-ejecutivos` | Tabla: ejecutivo, ganado (PEN/USD), win rate, Cotiz. (= `cantidadCerradas`, ver Gap #3). **No recibe ejecutivo.** |
| `dashboard-motivos-perdida.tsx` | `motivos-perdida` | `BarChart` horizontal por `motivoOriginal` × `cantidad`. |
| `dashboard-embudo.tsx` | `embudo-conversion` | Embudo (barras decrecientes solicitud→cotizada→enviada→ganada; "ever-reached"). |
| `dashboard-acciones.tsx` | `acciones-pendientes` | 3 columnas (`DashboardListaAccionable` × 3): Por vencer 72 h / Esperando aprobación / Sin cotizar, alimentadas por un único `useConsulta`. |

**Descartado** un único componente monolítico que fetchee los 8 endpoints y reparta por
props: viola el aislamiento de carga/error por widget (D10) y hace que un fallo tumbe todo
el dashboard.

### D5 — Estado global: `idEjecutivoResponsable` (existente) + `periodo` (nuevo) elevados en `DashboardVista`

Se conserva el patrón Fase 1 (design Fase 1, D2): `useState` elevado en
`dashboard-vista.tsx`, sin estado global ni URL params. Se agrega un segundo estado:

```ts
const [idEjecutivoResponsable, setIdEjecutivoResponsable] = useState<IdEjecutivoFiltro>(undefined);
const [periodo, setPeriodo] = useState<RangoPeriodo>(/* mes actual */);
```

`RangoPeriodo` en frontend es `{ desde?: string; hasta?: string }` (ISO date). El backend
cae al **mes calendario actual** si no se envían ambos (`dashboard-periodo.dto.ts:5-8`,
`RangoPeriodo.resolver`), así que el estado inicial puede ser `{}` (deja decidir al
backend) o un preset explícito del selector.

Ambos valores bajan por props a cada widget y entran como **deps de `useConsulta`**, por lo
que un cambio de filtro refetchea solo los widgets que dependen de ese filtro (matriz de la
Restricción verificada). El nuevo `dashboard-selector-periodo.tsx` (presets:
Este mes / Mes anterior / Últimos 30/90 días / rango custom — a confirmar con negocio) es
un componente controlado, hermano de `DashboardFiltroEjecutivo`, que solo llama
`setPeriodo`.

Propagación por widget:
- `kpis-dinero`, `win-rate`, `ciclo`, `motivos`, `embudo`: reciben `{ periodo, idEjecutivoResponsable }`.
- `ranking`: recibe solo `{ periodo }` (ejecutivo ignorado por el backend — D-restricción).
- `tendencia`: recibe solo `{ idEjecutivoResponsable }` (+ opcional `meses`) — **no** período (D6).
- `acciones`: recibe solo `{ idEjecutivoResponsable }` — no período.

**Descartado** `nuqs`/URL search param (no instalado; misma razón que Fase 1 D2:
pantalla de arranque personal, deep-link de bajo valor) y **descartado** un contexto de
React global (dos valores planos no lo justifican; prop-drilling de un nivel es más legible).

### D6 — `tendencia-mensual` NO recibe período (gap #4, decidido)

Una gráfica de tendencia **es intrínsecamente** una ventana temporal fija; superponerle el
selector de período global sería contradictorio. El endpoint calcula su propia ventana de
`meses` hacia atrás e **ignora `desde`/`hasta`** (`obtener-tendencia-mensual.use-case.ts:43-59`).
Por eso el widget `dashboard-tendencia.tsx` **no** recibe la prop `periodo` y su
`useConsulta` **no** lista `periodo` en deps — solo `{ idEjecutivoResponsable, meses }`.
`meses` queda fijo en el default del backend (6) salvo que se agregue un toggle propio del
widget (fuera de alcance). Sin cambio de backend.

### D7 — Charting: recharts, tipo de gráfica por widget

recharts 3.8.0 ya es dependencia y ya se usa con `ChartContainer`/`ChartConfig`
(`chart-area-interactive.tsx`). Se reutiliza ese wrapper (`@/compartido/componentes/ui/chart`)
para tooltips y theming coherentes. Tipo por widget:

| Widget | Tipo recharts | Notas |
|---|---|---|
| Win rate | `PieChart` + `Pie innerRadius` (donut) | 2 sectores ganadas/perdidas; centro con el % |
| Tendencia | `BarChart` con 2 `Bar` (ganado/perdido) | agrupado por mes; eje X `${mes}/${anio}` |
| Motivos de pérdida | `BarChart` `layout="vertical"` | barras horizontales por `motivoOriginal` |
| Embudo | `BarChart` horizontal decreciente o barras apiladas | 4 etapas "ever-reached" |
| KPI dinero / ciclo / ranking | sin gráfica (tarjetas/tabla) | dinero y ciclo son tiles; ranking es `Table` |

Los colores se referencian **siempre** como `var(--color-<serie>)` vía `ChartConfig`
(patrón `chart-area-interactive.tsx:129-141,267-280`), nunca hex inline.

### D8 — Paleta dataviz como CSS custom properties de tema (claro Y oscuro)

La paleta del mockup (teal / rose / amber) **no existe** en el tema actual. Se agrega como
CSS vars globales en el archivo de tema (`globals.css` / bloque `:root` y `.dark`), siguiendo
el patrón `--color-x` que `ChartConfig` mapea. Cada widget declara su `ChartConfig` apuntando
a estas vars (`color: "var(--chart-ganado)"`, etc.).

Semántica → color (validar contraste WCAG AA sobre el fondo de `Card` en ambos temas):

| Rol | Var propuesta | Claro | Oscuro (aclarado para contraste) |
|---|---|---|---|
| Ganado / positivo | `--dataviz-teal` | `#0d9488` | `#2dd4bf` |
| Perdido / negativo | `--dataviz-rose` | `#e11d48` | `#fb7185` |
| Atención / neutro | `--dataviz-amber` | `#d97706` | `#fbbf24` |

Los valores oscuros se aclaran respecto al mockup porque `#0d9488`/`#e11d48`/`#d97706`
sobre fondo oscuro caen por debajo de contraste legible. **Se debe validar** el contraste
real de cada par contra el token de fondo del `Card` en claro y oscuro antes de fijar los
hex (los de la tabla son el punto de partida, no definitivos). **Descartado** hardcodear los
hex del mockup en ambos temas (ilegibles en oscuro — riesgo #1 del proposal) y **descartado**
usar los tokens `--chart-1..5` genéricos del template (no son la paleta semántica del mockup).

### D9 — Render de dinero: promover `formatearMoneda` a compartido

Hoy existe `formatearMoneda(monto, moneda)` **local** en
`cotizaciones/componentes/lineas-grid.utils.ts:72-80` (`S/`/`US$` + `toLocaleString("es-PE")`,
2 decimales). El dashboard lo necesita en ~5 widgets. Se **promueve** a un helper compartido
`src/compartido/utilidades/formato-moneda.ts` (o `src/modulos/comercial/compartido/`) y el
call-site de Cotizaciones re-importa desde ahí (cambio mecánico, mismo output). Firma:
`formatearMoneda(monto: number, moneda: "PEN" | "USD"): string`.

Regla de negocio crítica (Success Criteria del proposal): **PEN y USD se muestran en campos
separados, nunca convertidos ni sumados**. Los tipos ya lo fuerzan (`TotalPorMoneda = {pen, usd}`,
dos campos independientes); el render itera ambos.

**Descartado** dejar el helper local y duplicarlo en el dashboard (dos verdades del formato de
dinero en el mismo BC) y **descartado** un componente `<Dinero/>` (over-engineering; una función
pura basta y encaja en tablas/tiles sin overhead de render).

### D10 — Carga/error por widget (cada uno tiene su `useConsulta`)

Como cada widget fetchea independiente, el estado de carga/error es **local a cada widget**,
no global. Patrón uniforme (espeja Fase 1 D4/D5): `isLoading` → `Skeleton` con la silueta del
widget; `isError` → `Alert` con `extraerMensajeError(error)`; vacío/`null` → estado explícito
("Sin datos en el período", distinto de "0"). Ningún widget bloquea a los demás: un 500 en
`motivos-perdida` no tumba los KPI. Se usa el `Card` como contenedor común para que skeleton,
error y contenido compartan chrome.

### D11 — Retiro de `utilidades/por-vencer.ts` (deuda Fase 1 saldada)

`utilidades/por-vencer.ts` (`esPorVencer`/`filtrarPorVencer`, la única deuda de negocio en
cliente de Fase 1) queda **obsoleto**: la ventana de 72 h ahora la calcula el backend y llega
en `acciones-pendientes.porVencer72h` (`dashboard.repository.ts:73`). Se **borra el archivo** y
el widget de acciones consume la lista ya filtrada. Cierra el plan de Fase 1 (design Fase 1 D6:
"Fase 2 lo borra").

### D12 — Deltas: asimetría real entre endpoints (verificada en el backend)

El proposal dice "los deltas los provee el backend en todos los KPI". Verificado: **no es
uniforme**, y el diseño lo trata explícitamente:

- `win-rate` y `ciclo-cierre` devuelven un **delta ya calculado**:
  `variacionVsMesAnterior: number | null` (puntos porcentuales / días)
  (`calcular-win-rate.use-case.ts:57-61`, `calcular-ciclo-cierre.use-case.ts:41-46`).
  El frontend lo consume directo, sin cálculo.
- `kpis-monetarios` devuelve **los KPIs crudos del período anterior**, NO un delta:
  `variacionVsMesAnterior: ResumenDineroPorEstado` (`obtener-kpis-monetarios.use-case.ts:11-19,40`).
  El frontend calcula el delta de dinero en cliente (`actual.ganado.pen − variacionVsMesAnterior.ganado.pen`, etc.).
  Sigue siendo **una sola llamada** (sin doble fetch); el nombre del campo es engañoso pero el
  contrato es claro. Se documenta en el tipo con un comentario.
- **Signo del ciclo**: `variacionVsMesAnterior` de ciclo es el delta **crudo** (actual − anterior),
  sin invertir aunque menos días sea mejor (`calcular-ciclo-cierre.use-case.ts:9-19`). El widget
  colorea con la convención "menos es mejor": delta negativo → verde/teal, positivo → rose.
  Riesgo #4 del proposal mitigado aquí.

## Gaps de la exploración — estado final

- **Gap #1 (win-rate delta) — RESUELTO (backend).** `variacionVsMesAnterior: number | null`
  en `WinRateResultado`. Frontend lo consume directo (D12).
- **Gap #2 (ciclo-cierre delta) — RESUELTO (backend).** `variacionVsMesAnterior: number | null`
  crudo; frontend colorea "menos es mejor" (D12).
- **Gap #3 (columna "Cotiz." del ranking) — CONFIRMADO.** El ranking NO expone un campo
  `cotizaciones`/`cantidad` genérico. `RankingEjecutivoResultado extends DineroPorEjecutivo`
  expone dos contadores (`dashboard.repository.ts:17-25`, `obtener-ranking-ejecutivos.use-case.ts:9-15`):
  **`cantidadGanadas`** (ganadas del período) y **`cantidadCerradas`** (= ganadas + perdidas, el
  denominador del win rate). La columna "Cotiz." (cierres del período) mapea a
  **`cantidadCerradas`**; si el mockup quiere "ganadas", es `cantidadGanadas`. El `winRate` por
  fila también viene pre-calculado (`number | null`). Nombres exactos a usar en el tipo:
  `ejecutivoId`, `ejecutivoNombre`, `ganado`, `pipeline`, `cantidadGanadas`, `cantidadCerradas`, `winRate`.
- **Gap #4 (período vs tendencia) — DECIDIDO.** `tendencia-mensual` no recibe período (D6).
- **Gap #5 (sin-cotizar × ejecutivo) — CONFIRMADO invariante de dominio.** `acciones-pendientes`
  sí acepta `idEjecutivoResponsable`, pero `solicitudesSinCotizar[]` siempre trae
  `idEjecutivoResponsable: null` (`dashboard.repository.ts:65-66`): las solicitudes sin cotizar no
  tienen dueño. No se scopea trabajo de backend.

## File layout

```
src/modulos/comercial/dashboard/
  servicios/dashboard-api.ts                      # NEW — 8 gets raw (D1)
  servicios/dashboard-queries.ts                  # NEW — 8 hooks useConsulta (D1)
  tipos/dashboard.tipos.ts                        # MOD — +tipos de respuesta, -guardrail (D2)
  componentes/dashboard-selector-periodo.tsx      # NEW — selector de período (D5)
  componentes/dashboard-kpis-dinero.tsx           # NEW — reemplaza dashboard-kpis (D4/D9)
  componentes/dashboard-win-rate.tsx              # NEW — donut (D4/D7)
  componentes/dashboard-ciclo-cierre.tsx          # NEW — tile + delta (D4/D12)
  componentes/dashboard-tendencia.tsx             # NEW — bar chart (D4/D6/D7)
  componentes/dashboard-ranking.tsx               # NEW — tabla (D4)
  componentes/dashboard-motivos-perdida.tsx       # NEW — bars (D4/D7)
  componentes/dashboard-embudo.tsx                # NEW — funnel (D4/D7)
  componentes/dashboard-acciones.tsx              # NEW — 3 listas (D4)
  componentes/dashboard-filtro-ejecutivo.tsx      # KEEP
  componentes/dashboard-lista-accionable.tsx      # KEEP (reuso en acciones)
  componentes/dashboard-kpis.tsx                  # REMOVE (reemplazado)
  componentes/dashboard-cotizaciones-por-aprobar.tsx  # REMOVE (colapsado en acciones)
  componentes/dashboard-solicitudes-sin-cotizar.tsx   # REMOVE
  componentes/dashboard-cotizaciones-por-vencer.tsx   # REMOVE
  utilidades/por-vencer.ts                        # REMOVE — deuda saldada (D11)
  vistas/dashboard-vista.tsx                      # MOD — +estado período (D5)
src/modulos/comercial/claves-consulta.ts          # MOD — +8 claves (D3)
src/compartido/utilidades/formato-moneda.ts       # NEW — formatearMoneda promovido (D9)
src/modulos/comercial/cotizaciones/componentes/lineas-grid.utils.ts  # MOD — re-import (D9)
globals.css (tema)                                # MOD — CSS vars dataviz claro/oscuro (D8)
src/app/(privado)/comercial/page.tsx              # REUSE — sin cambios de ruta
```

## Data flow

```
DashboardVista (estado: idEjecutivoResponsable, periodo)
 ├─ DashboardFiltroEjecutivo ── useEjecutivosCotizacionesQuery()      (setea idEjecutivo)
 ├─ DashboardSelectorPeriodo  ── (presets)                            (setea periodo)
 ├─ DashboardKpisDinero    ── useKpisMonetarios({ periodo, idEjecutivo })     → { actual, variacionVsMesAnterior }
 ├─ DashboardWinRate       ── useWinRate({ periodo, idEjecutivo })            → { ganadas, perdidas, winRate, variacionVsMesAnterior }
 ├─ DashboardCicloCierre   ── useCicloCierre({ periodo, idEjecutivo })        → { cicloPromedioDias, variacionVsMesAnterior }
 ├─ DashboardTendencia     ── useTendenciaMensual({ idEjecutivo })            → PuntoTendenciaMensual[]     (SIN periodo — D6)
 ├─ DashboardRanking       ── useRankingEjecutivos({ periodo })               → RankingEjecutivo[]          (SIN ejecutivo — D-restricción)
 ├─ DashboardMotivosPerdida── useMotivosPerdida({ periodo, idEjecutivo })     → { motivos[] }
 ├─ DashboardEmbudo        ── useEmbudoConversion({ periodo, idEjecutivo })   → { solicitud, cotizada, enviada, ganada }
 └─ DashboardAcciones      ── useAccionesPendientes({ idEjecutivo })          → { porVencer72h[], esperandoAprobacion[], solicitudesSinCotizar[] }
                                └─ 3× DashboardListaAccionable (reuso Fase 1)
```

Todas las llamadas salen por `clienteComercial` → BFF `/api/comercial` (Bearer inyectado
server-side). Cero auth en frontend; `bc03:dashboard:leer` se aplica backend-side.

## Testing strategy

Sin test runner (Standard Mode). Gate: `pnpm build` + `pnpm lint`. Verificación manual:
- Cambiar ejecutivo recalcula kpis/win-rate/ciclo/tendencia/motivos/embudo/acciones; ranking
  NO cambia (invariante D-restricción).
- Cambiar período recalcula kpis/win-rate/ciclo/ranking/motivos/embudo; tendencia y acciones
  NO cambian (D6, D-restricción).
- KPI de dinero muestran PEN y USD separados; nunca un total combinado.
- `winRate`/`cicloPromedioDias` en `null` renderizan "sin datos", no "0".
- Delta de ciclo negativo se colorea verde (menos es mejor); positivo, rojo.
- Paleta legible en claro y oscuro (inspección visual + contraste).
- Un endpoint caído solo degrada su propio widget (carga/error aislados, D10).

## Threat Matrix

N/A — sin routing dinámico, sin shell/subprocess, sin automatización VCS/PR, sin
clasificación de ejecutables. Solo lecturas GET autenticadas por el BFF existente.

## Migration / Rollout

Cambio aditivo y de presentación, sin migraciones ni estado persistido (proposal §Rollback).
Rollback = revertir el commit del recableado, restaurar `dashboard-kpis.tsx` +
`utilidades/por-vencer.ts` + las 3 listas Fase 1 + las CSS vars de tema previas.
`/comercial` vuelve a las tarjetas de conteo de Fase 1. Los 8 endpoints de BC03 permanecen.

## Open Questions

- [ ] Presets del selector de período (Este mes / Mes anterior / 30 / 90 / custom) — confirmar
      con negocio; el backend acepta cualquier `desde`/`hasta` ISO o cae a mes actual.
- [ ] Hex definitivos de la paleta oscura tras validar contraste real contra el token de `Card`
      (los de D8 son punto de partida).
- [ ] Columna "Cotiz." del ranking: confirmar con el mockup si es `cantidadCerradas` (cierres)
      o `cantidadGanadas` (ganadas) — ambos disponibles (Gap #3).
- [ ] `meses` de tendencia: ¿toggle propio del widget o fijo en 6 (default backend)? — fuera de
      alcance salvo pedido explícito.
```
