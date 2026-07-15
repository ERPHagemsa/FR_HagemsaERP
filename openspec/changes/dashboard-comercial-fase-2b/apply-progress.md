# Apply progress — Dashboard Comercial Fase 2b

## Pasada 1: WU1 (tríada de datos) + WU2 (compartidos)

Tareas 1.1–1.4 y 2.1–2.5 marcadas `[x]` en `tasks.md`. WU3-6 (widgets +
wiring de `DashboardVista` + retiro de deuda Fase 1) **NO** se tocaron en
esta pasada — quedaron pendientes de una pasada posterior.

## Pasada 2: WU3 + WU4 + WU5 (los 8 widgets del dashboard)

Tareas 3.1–3.8 marcadas `[x]` en `tasks.md`. Alcance ESTRICTO: solo los 8
componentes de presentación bajo `src/modulos/comercial/dashboard/componentes/`.
NO se tocó `DashboardVista` (WU6, wiring) ni se retiró deuda Fase 1 (4.2) —
los componentes Fase 1 (`dashboard-kpis.tsx`, las 3 listas concretas,
`utilidades/por-vencer.ts`) siguen intactos y sin importar los widgets
nuevos; ambos árboles conviven sin conflicto hasta que WU6 haga el swap.

### Archivos creados (WU3-5)

- `dashboard-kpis-dinero.tsx` — consume `useKpisMonetariosQuery`; franja
  Ganado/Pipeline/Ticket promedio, PEN y USD en líneas separadas; delta vía
  `calcularDeltaMonetario(actual, variacionVsMesAnterior)` por métrica.
- `dashboard-win-rate.tsx` — consume `useWinRateQuery`; donut
  `PieChart`/`Pie innerRadius` (ganadas/perdidas, `var(--dataviz-teal)`/
  `var(--dataviz-rose)`) + `winRate`/`variacionVsMesAnterior` null-safe.
- `dashboard-ciclo-cierre.tsx` — consume `useCicloCierreQuery`; tile "N días"
  + delta coloreado "menos es mejor" (negativo=verde, positivo=rojo, signo
  crudo sin invertir).
- `dashboard-tendencia.tsx` — consume `useTendenciaMensualQuery({ idEjecutivoResponsable })`
  (sin período, D6); 2 `BarChart` agrupados (ganado/perdido) — uno por PEN,
  uno por USD (ver desviación abajo).
- `dashboard-ranking.tsx` — consume `useRankingEjecutivosQuery({ periodo })`
  (sin ejecutivo); `Table` ordenada por `ganado.pen` desc, "Cotiz."
  = `cantidadCerradas`, `winRate` null-safe.
- `dashboard-motivos-perdida.tsx` — consume `useMotivosPerdidaQuery`;
  `BarChart layout="vertical"` por `motivoOriginal`×`cantidad`,
  `var(--dataviz-amber)`.
- `dashboard-embudo.tsx` — consume `useEmbudoConversionQuery`; `BarChart`
  horizontal con las 4 etapas solicitud→cotizada→enviada→ganada,
  `var(--dataviz-teal)`.
- `dashboard-acciones.tsx` — consume `useAccionesPendientesQuery({ idEjecutivoResponsable })`
  (sin período); 3× `DashboardListaAccionable` reusado, mapeando
  `AccionPendiente[]` → `DashboardItemAccionable[]` (porVencer72h/
  esperandoAprobacion → `/comercial/cotizaciones/{id}`, solicitudesSinCotizar
  → `/comercial/solicitudes-cliente/{id}`).

### Gate (WU3-5 solamente)

- `pnpm build`: **verde** — compiló y generó las 55 páginas sin errores TS.
- `pnpm lint`: **verde para los 8 archivos nuevos** (cero apariciones de
  `dashboard` en la salida completa de eslint). El repo mantiene su deuda
  preexistente (103 errores/1491 warnings) en módulos no tocados
  (`activos`, `administracion`, `socio-negocios`, `flota`,
  `configuracion-general`, `perfil`) — sin relación con esta pasada.

### Desviaciones / decisiones de esta pasada

1. **Props de los widgets `{periodo, idEjecutivoResponsable}`**: el tipo
   `FiltrosDashboardPeriodoEjecutivo` de `dashboard.tipos.ts` (WU1) es
   `RangoPeriodo & { idEjecutivoResponsable }` — es decir, `desde`/`hasta`
   YA APLANADOS, no anidados bajo una clave `periodo`. Como design D5 pide
   que los widgets reciban la prop como `{ periodo: RangoPeriodo,
   idEjecutivoResponsable }` (anidado, elevado en `DashboardVista`), definí
   un tipo local `PropsPeriodoEjecutivo` en cada uno de los 5 widgets
   period+ejecutivo y hago spread `{ ...periodo, idEjecutivoResponsable }`
   al llamar al hook. `dashboard-ranking.tsx` recibe `{ periodo:
   RangoPeriodo }` y pasa `periodo` directo (mismo shape que
   `FiltrosDashboardRanking`). Intenté primero destructurar `periodo`
   directo del tipo de filtros del hook — no compilaba (`pnpm build`
   detectó el error, corregido antes de continuar).
2. **`tendencia-mensual` con PEN y USD separados**: tasks.md 3.4 dice
   literalmente "2 Bar (ganado/perdido)", pero la spec ("Tendencia mensual
   ganado vs. perdido") exige PEN y USD por separado, nunca sumados. Resolví
   la aparente tensión renderizando DOS gráficas (`BarChart` PEN y `BarChart`
   USD), cada una con los 2 `Bar` que pide tasks.md — cumple ambos textos a
   la vez. Si el mockup real solo esperaba una gráfica en una moneda,
   ajustar en revisión.
3. **Escala de `winRate`**: el DTO no documenta si es fracción (0-1) o
   porcentaje (0-100). La spec llama a la variación "puntos porcentuales",
   lo que solo tiene sentido semántico si la base ya está en escala 0-100 (la
   diferencia entre dos fracciones no se llamaría "puntos porcentuales" sin
   multiplicar por 100 primero). Renderizo `winRate.toFixed(1)+"%"` sin
   multiplicar — asumiendo 0-100. **Riesgo a verificar contra BC03 real**: si
   el backend en realidad manda 0-1, el widget mostraría "0.4%" en vez de
   "40.0%". Recomendado confirmar contra una respuesta real de
   `/dashboard/win-rate` antes de dar por cerrado WU3.
4. **`dashboard-acciones.tsx` — URLs de detalle**: `AccionPendiente` no trae
   un discriminador de tipo (cotización vs. solicitud); inferí que
   `porVencer72h`/`esperandoAprobacion` son cotizaciones (`ENVIADA`/
   pendiente de aprobación, ambos estados de `Cotizacion`) y
   `solicitudesSinCotizar` son solicitudes, siguiendo el mismo patrón de
   enlaces que los componentes Fase 1 (`dashboard-cotizaciones-por-aprobar.tsx`,
   `dashboard-solicitudes-sin-cotizar.tsx`). No verificado contra BC03.

## Archivos creados

- `src/modulos/comercial/dashboard/servicios/dashboard-api.ts` — 8 funciones
  raw `clienteComercial.get<T>()`.
- `src/modulos/comercial/dashboard/servicios/dashboard-queries.ts` — 8 hooks
  `useConsulta`.
- `src/compartido/utilidades/formato-moneda.ts` — `formatearMoneda` promovido.
- `src/modulos/comercial/dashboard/utilidades/delta-monetario.ts` —
  `calcularDeltaMonetario(actual: TotalPorMoneda, anterior: TotalPorMoneda): TotalPorMoneda`.
- `src/modulos/comercial/dashboard/utilidades/periodo-preset.ts` —
  `resolverPeriodoPreset(preset, ahora?)` + `ETIQUETAS_PERIODO_PRESET`.
- `src/modulos/comercial/dashboard/componentes/dashboard-selector-periodo.tsx` —
  selector controlado (4 presets + rango custom vía `Popover`/`Calendar mode="range"`).

## Archivos modificados

- `src/modulos/comercial/dashboard/tipos/dashboard.tipos.ts` — guardrail
  Fase 1 levantado; +tipos de respuesta espejo de los 8 DTOs de BC03,
  +`RangoPeriodo`/`PeriodoPreset`, +4 tipos de filtros por endpoint. Tipos
  Fase 1 de conteo (`DashboardKpisProps`, `DashboardListaEspecificaProps`)
  se dejaron intactos a propósito (se retiran en la tarea 4.2, fuera de
  alcance de esta pasada).
- `src/modulos/comercial/claves-consulta.ts` — +8 claves `CLAVE_DASHBOARD_*`.
- `src/modulos/comercial/cotizaciones/componentes/lineas-grid.utils.ts` —
  re-importa `formatearMoneda` desde el módulo compartido y lo re-exporta
  (mismo output, cero call-sites rotos).
- `src/compartido/utilidades/index.ts` — +re-export de `formatearMoneda`.
- `src/app/globals.css` — +`--dataviz-teal`/`--dataviz-rose`/`--dataviz-amber`
  en `:root` y `.dark`, con el contraste validado documentado en comentario.

## Gate (WU1+WU2 solamente — sin widgets, sin wiring)

- `pnpm build`: **verde**. Compiló y generó las 55 páginas estáticas/dinámicas
  sin errores de TypeScript.
- `pnpm lint`: el repo tiene deuda de lint preexistente en otros módulos
  (103 errores/1491 warnings, ninguno en archivos tocados por esta pasada —
  verificado filtrando la salida por los paths nuevos/modificados). Ningún
  archivo de WU1/WU2 aparece en la salida de `eslint`.

## Notas / desviaciones

- El prompt de la tarea original mencionó `src/compartido/api/claves-consulta.ts`
  para la tarea 1.2; el archivo real (confirmado en design.md y en el repo)
  es `src/modulos/comercial/claves-consulta.ts` — se usó la ruta real.
- Contraste WCAG de la paleta dataviz (tarea 2.4) calculado numéricamente
  (oklch→sRGB lineal→luminancia relativa) contra `--card` en ambos temas:
  claro (teal 3.74:1, rose 4.70:1, amber 3.19:1 — los 3 superan el umbral de
  objeto gráfico no-textual 3:1 de WCAG 2.1 SC 1.4.11, aplicable porque son
  rellenos de gráfica, no texto) y oscuro (teal 9.62:1, rose 6.66:1, amber
  10.73:1 — superan holgadamente incluso el umbral de texto 4.5:1). No fue
  necesario ajustar los hex de la tabla D8 del design; se documentó el
  resultado en el comentario de `globals.css` junto a las vars, como pide 2.4.

## Pasada 3: WU6 (wiring de `DashboardVista` + retiro de deuda Fase 1) + WU7 (gate final)

Tareas 4.1, 4.2 y 5.1 marcadas `[x]` en `tasks.md`. 5.2 (verificación manual
en navegador contra BC03 corriendo) queda **fuera del alcance del agente**
por instrucción explícita del usuario ("no start a dev server, verificación
manual la hace el usuario") — se anotó en `tasks.md` y se deja sin marcar.

Nota recibida del usuario antes de esta pasada: ya corrigió manualmente un
bug de escala de `winRate` (backend devuelve fracción 0-1, se muestra ×100)
en `dashboard-win-rate.tsx` y `dashboard-ranking.tsx` — resuelve la
"Desviación 3" documentada en la Pasada 2. No se tocó ese código en esta
pasada; se verificó que sigue intacto (`(data.winRate * 100).toFixed(1)}%`
en ambos archivos).

### 4.1 — Reescritura de `dashboard-vista.tsx`

Estado elevado: `idEjecutivoResponsable` (Fase 1, sin cambios de contrato) +
`periodo: RangoPeriodo` nuevo, inicializado con
`resolverPeriodoPreset("este-mes")` (lazy initializer de `useState`, evita
recalcular en cada render). Header: `DashboardFiltroEjecutivo` +
`DashboardSelectorPeriodo` como hermanos en una fila `flex flex-wrap
items-end gap-4`. Grid del cuerpo (`flex flex-col gap-6` en el contenedor
raíz, consistente con Fase 1):

1. `DashboardKpisDinero` — franja full-width.
2. `grid lg:grid-cols-2`: `DashboardWinRate` + `DashboardCicloCierre`.
3. `DashboardTendencia` — full-width.
4. `DashboardRanking` — full-width.
5. `grid lg:grid-cols-2`: `DashboardMotivosPerdida` + `DashboardEmbudo`.
6. `DashboardAcciones` — full-width (ya trae su propio `grid lg:grid-cols-3`
   interno para las 3 listas).

#### Tabla de propagación de props implementada

| Widget | `periodo` | `idEjecutivoResponsable` |
|---|---|---|
| `DashboardKpisDinero` | Sí | Sí |
| `DashboardWinRate` | Sí | Sí |
| `DashboardCicloCierre` | Sí | Sí |
| `DashboardMotivosPerdida` | Sí | Sí |
| `DashboardEmbudo` | Sí | Sí |
| `DashboardTendencia` | **No** (D6, ventana propia `meses`) | Sí |
| `DashboardRanking` | Sí | **No** (endpoint ignora el filtro, D-restricción) |
| `DashboardAcciones` | **No** (no period-scoped) | Sí (internamente `solicitudesSinCotizar` no varía — invariante de dominio ya resuelto dentro del widget) |

Coincide exactamente con design D5 y con la tabla de restricción verificada
de `design.md`.

### 4.2 — Retiro de deuda Fase 1

Borrados (confirmado con `rm`, no `git rm` porque el repo no es git-tracked
en este entorno de ejecución — aun así se verificó con `git status --short`
que el índice local sí reconoce los borrados como `D`):

- `src/modulos/comercial/dashboard/componentes/dashboard-kpis.tsx`
- `src/modulos/comercial/dashboard/componentes/dashboard-cotizaciones-por-aprobar.tsx`
- `src/modulos/comercial/dashboard/componentes/dashboard-solicitudes-sin-cotizar.tsx`
- `src/modulos/comercial/dashboard/componentes/dashboard-cotizaciones-por-vencer.tsx`
- `src/modulos/comercial/dashboard/utilidades/por-vencer.ts`

**Prueba de que nada más los importaba** (grep sobre `src/` completo antes
de borrar): el único consumidor de los 4 componentes era el propio
`dashboard-vista.tsx` (ya reescrito en 4.1); `filtrarPorVencer` de
`por-vencer.ts` solo lo importaba `dashboard-cotizaciones-por-vencer.tsx`
(borrado en el mismo paso). Grep post-borrado confirma cero referencias
residuales (solo queda un comentario histórico mencionando los nombres de
tipo retirados, sin ser un import real).

`dashboard.tipos.ts`: se retiraron `DashboardKpisProps` y
`DashboardListaEspecificaProps` (sin otro consumidor tras 4.1, confirmado
por grep) y se actualizó el comentario de cabecera del archivo. Se
**conservó** `DashboardListaAccionableProps`/`DashboardItemAccionable`
(design D4: `DashboardListaAccionable` se reusa, no se retira) y todo lo
demás (`IdEjecutivoFiltro`, `RangoPeriodo`, tipos de respuesta, tipos de
filtros por endpoint).

Post-retiro, `componentes/` queda con exactamente 11 archivos: los 8
widgets nuevos + `dashboard-filtro-ejecutivo.tsx` (KEEP) +
`dashboard-lista-accionable.tsx` (KEEP, reusado) +
`dashboard-selector-periodo.tsx` (WU2) — igual al `File layout` de
`design.md`. `utilidades/` queda con `delta-monetario.ts` +
`periodo-preset.ts` (sin `por-vencer.ts`).

### 5.1 — Gate final

**`pnpm build`** (`pnpm --pm-on-fail=ignore build`): **verde**. Compiló con
Turbopack en 9.6s, TypeScript en 9.9s, generó las 55 rutas (estáticas +
dinámicas) sin errores. Salida completa revisada — sin warnings de tipos ni
de build en ningún archivo del change.

**`pnpm lint`** (`pnpm --pm-on-fail=ignore lint`): el comando termina con
exit code 1 por **103 errores / 1491 warnings preexistentes** en módulos NO
tocados por este change (`activos` — principalmente
`react-hooks/set-state-in-effect` en `inventario-fisico-detalle-panel.tsx`,
`tanques-activo.tsx`, `carga-masiva-vista.tsx`, etc.;
`administracion/crear-cuenta-vista.tsx` —
`react/no-unescaped-entities`; `socio-negocios/asignacion-formulario.tsx`;
warnings sueltos en `configuracion-general`, `flota`, `perfil`). Se filtró
la salida completa buscando `dashboard`, `formato-moneda` y
`lineas-grid` (los paths de este change) — **cero coincidencias**: ningún
archivo tocado por WU1-WU6 aparece en la salida de eslint. El gate de
"lint limpio para archivos tocados" (WU7, alcance de esta tarea) se cumple;
no se tocó código ajeno para no mass-reformatear archivos fuera de alcance.

### Contrato estático verificado (5.1, sanity adicional)

- Grep de los 4 componentes/`por-vencer.ts` borrados sobre `src/`: cero
  imports residuales.
- Props de cada widget en `dashboard-vista.tsx` inspeccionadas contra la
  firma real exportada por cada componente (leída directamente de cada
  archivo antes de escribir la vista) — coinciden 1:1 con la tabla de
  propagación arriba.
- `git status --short` post-cambios: el diff resultante coincide
  exactamente con el `File layout` de `design.md` (mismos archivos
  creados/modificados/borrados, sin sorpresas fuera de alcance).

## Estado final del change

Implementación completa: WU1–WU6 con código y gate (`pnpm build` +
`pnpm lint`) en verde para todo lo tocado. Pendiente únicamente 5.2
(checklist de verificación manual en navegador contra BC03 corriendo),
que el usuario ejecuta directamente fuera de este agente — no bloqueante
para considerar el change implementation-complete a nivel de código.
