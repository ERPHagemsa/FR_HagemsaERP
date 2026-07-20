# Dashboard Comercial — Fase 2b (rewire frontend a los 8 endpoints de BC03)

## Why

El `/comercial` de Fase 1 solo muestra **tarjetas de conteo** (buckets de cotizaciones
y solicitudes, all-time bajo el filtro de ejecutivo) y arrastra una deuda declarada:
el umbral "por vencer 72 h" se calcula **en cliente**. Fase 2 ya cerró en BC03: se
publicaron **8 endpoints reales de agregación** (`/api/dashboard/*`, todos exigen
`bc03:dashboard:leer`): KPI de dinero PEN/USD, win rate + delta, ciclo de cierre +
delta, tendencia mensual, ranking de ejecutivos, motivos de pérdida, embudo de
conversión y acciones pendientes.

Este change **recablea el frontend** para consumir esos endpoints y renderizar el
dashboard decision-grade aprobado en el mockup. No es una pantalla nueva: es la
misma shell de Fase 1 conectada a datos de negocio reales, con dinero, tasas y
tendencias que hoy no existen en pantalla.

## Scope

### In Scope

- **Recablear `/comercial`** para renderizar los widgets del mockup, cada uno
  conectado a su endpoint según el widget→endpoint mapping de la exploración.
- **Tríada nueva de dashboard**: `dashboard-api.ts` + `dashboard-queries.ts` +
  extensión de `tipos/dashboard.tipos.ts` (convención per-BC). Fase 1 no tuvo par
  api/queries a propósito — esta es una **reversión documentada**, no una violación.
- **Conservar la shell**: `DashboardVista`, `DashboardFiltroEjecutivo` (filtro global
  de ejecutivo) y `DashboardListaAccionable`.
- **Reemplazar `DashboardKpis`** por la franja de KPI monetarios (PEN/USD separados,
  nunca convertidos) y **agregar** los componentes de widget nuevos (win rate + donut,
  ciclo de cierre, tendencia ganado/perdido, ranking, motivos de pérdida, embudo).
- **Retirar `utilidades/por-vencer.ts`** (deuda Fase 1): la regla 72 h la provee ahora
  `acciones-pendientes.porVencer72h`.
- **Selector global de período** que alimenta los endpoints period-scoped. Excepción
  explícita: `tendencia-mensual` (ventana fija "últimos N meses" — gap #4 decidido).
- **Gráficas con recharts** (ya dependencia). Introducir la paleta dataviz validada
  teal `#0d9488` / rose `#e11d48` / amber `#d97706` como CSS vars de tema siguiendo el
  patrón existente `ChartConfig` / `var(--color-x)`. Debe funcionar en claro **y** oscuro.

Los deltas los provee ahora el backend en todos los KPI (win-rate y ciclo-cierre
ganaron `variacionVsMesAnterior` — gaps #1/#2 RESUELTOS). Sin doble llamada en frontend.

### Out of Scope

- **Cualquier cambio de backend en BC03** — Fase 2 está cerrada.
- **Filtro sin-cotizar × ejecutivo** — invariante de dominio confirmado (non-gap #5):
  las solicitudes sin asignar no tienen dueño (`idEjecutivoResponsable` siempre `null`).
- **Actualización en tiempo real / websockets.**
- **Export / PDF.**

## Capabilities

### New Capabilities
- None. No se introduce una capability nueva; se recablea la existente.

### Modified Capabilities
- `dashboard-comercial`: los widgets pasan de conteos all-time (composición de hooks
  de lectura de Cotizaciones/Solicitudes) a KPI de negocio agregados por 8 endpoints
  dedicados de BC03 (dinero PEN/USD, win rate, ciclo, tendencia, ranking, motivos,
  embudo, acciones), con selector de período y regla 72 h movida a backend.

## Approach

**Rewire, don't rebuild** (recomendación de la exploración). Se mantiene la shell
`DashboardVista` / `DashboardFiltroEjecutivo` / `DashboardListaAccionable`, se sustituye
`DashboardKpis`, se agregan componentes por widget, y se añade la tríada
`dashboard-{api,queries}.ts` + tipos siguiendo el patrón `useConsulta<T>` /
`clienteComercial` / `claves-consulta.ts`. El BFF proxy (`/api/comercial`) ya inyecta el
`Authorization: Bearer` server-side: **cero trabajo de auth en frontend**;
`bc03:dashboard:leer` se aplica backend-side.

## Affected Areas

| Área | Impacto | Descripción |
|------|--------|-------------|
| `src/modulos/comercial/dashboard/servicios/dashboard-{api,queries}.ts` | New | Tríada de acceso a los 8 endpoints `/api/dashboard/*`. |
| `src/modulos/comercial/dashboard/tipos/dashboard.tipos.ts` | Modified | Extender para dinero PEN/USD, win rate, deltas, ranking, embudo (levantar guardrail Fase 1). |
| `src/modulos/comercial/dashboard/componentes/**` | Modified/New | Reemplazar `DashboardKpis`; agregar widgets (KPI dinero, win rate, ciclo, tendencia, ranking, motivos, embudo). |
| `src/modulos/comercial/dashboard/vistas/dashboard-vista.tsx` | Modified | Portar selector de período; conservar filtro de ejecutivo. |
| `src/modulos/comercial/dashboard/utilidades/por-vencer.ts` | Removed | Obsoleto por `acciones-pendientes.porVencer72h`. |
| `src/app/(privado)/comercial/page.tsx` | Reused | Sigue montando `DashboardVista`; sin cambios de ruta. |
| Tema global (CSS vars `--color-*`) | Modified | Paleta dataviz teal/rose/amber para claro y oscuro. |
| Endpoints `/api/dashboard/*` + BFF proxy | Reused | Solo lectura; sin cambios de backend ni de proxy. |

## Risks

| Riesgo | Prob. | Mitigación |
|------|------|------------|
| Paleta dataviz ilegible en modo oscuro | Media | Definirla como CSS vars por tema y validar contraste en claro y oscuro. |
| Nombre de campo del ranking ("Cotiz.") incierto | Baja | Verificar en spec/design contra `obtener-ranking-ejecutivos.use-case.ts` (gap #3). |
| Selector de período mal aplicado a `tendencia-mensual` | Baja | Excepción explícita documentada (gap #4): ese widget no recibe período. |
| Signo del delta de ciclo mal coloreado (menos = mejor) | Baja | El backend da sign crudo; el frontend colorea con la convención "menos es mejor". |

## Rollback Plan

Cambio aditivo y de presentación, sin migraciones ni estado persistido. Rollback =
revertir el commit del recableado, restaurar `DashboardKpis` + `utilidades/por-vencer.ts`
y las CSS vars de tema previas. `/comercial` vuelve a las tarjetas de conteo de Fase 1.
Los 8 endpoints de BC03 permanecen (no se tocan).

## Dependencies

- 8 endpoints Fase 2 de BC03 vivos (`/api/dashboard/*`, `bc03:dashboard:leer`).
- Deltas backend-provistos (`variacionVsMesAnterior` en win-rate y ciclo-cierre, commit `d1dfe4b`).
- recharts 3.8.0 (ya dependencia).
- BFF proxy `/api/comercial` inyectando `Authorization: Bearer` (ya en producción).

## Success Criteria

- [ ] `/comercial` renderiza los widgets del mockup, cada uno con datos de su endpoint.
- [ ] KPI de dinero muestran PEN y USD separados, nunca convertidos.
- [ ] Los deltas (win rate, ciclo) se leen del backend; sin doble llamada en frontend.
- [ ] El selector de período recalcula los widgets period-scoped; `tendencia-mensual` queda exento.
- [ ] Las gráficas recharts usan la paleta dataviz y son legibles en claro y oscuro.
- [ ] `utilidades/por-vencer.ts` eliminado; la regla 72 h viene de `acciones-pendientes`.
- [ ] Cero cambios de backend/proxy; cero trabajo de auth en frontend.
- [ ] `pnpm build` + `pnpm lint` en verde.
