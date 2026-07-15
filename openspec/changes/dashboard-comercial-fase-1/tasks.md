# Tareas: Dashboard Comercial — Fase 1 (frontend)

> Slice nuevo `dashboard` de solo lectura/composición que reusa hooks existentes de
> Cotizaciones y Solicitudes, más un refactor presentacional de `calendario` para
> embeberlo. Orden por dependencia: tipos/utilidad → extracción calendario → widgets
> → vista/wiring de ruta. Entrega: commits directos a `desarrollo`, sin PRs (convención
> del repo). Sin test runner: gate = `pnpm build` + `pnpm lint`.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~650-700 (8 archivos nuevos + 1 extracción de `calendario` + 3 modificaciones) |
| 400-line budget risk | High (total del change) — cada Work Unit individual queda por debajo de ~220 líneas |
| Chained PRs recommended | Yes |
| Suggested split | WU1 tipos/utilidad → WU2 extracción `CalendarioPanel` → WU3 KPIs/filtro/lista base → WU4 listas específicas → WU5 vista + wiring de ruta → WU6 gate |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main (adaptado: el repo no usa PRs; cada WU es un commit atómico que aterriza en orden sobre `desarrollo`, equivalente funcional a stacked-to-main sin envoltorio de PR) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Tipos de presentación + utilidad `por-vencer` (1.1, 1.2) | WU1 (commit) | `pnpm build` | N/A — funciones puras, sin UI todavía | Borrar `dashboard/tipos/`, `dashboard/utilidades/` |
| 2 | Extraer `CalendarioPanel` sin cambiar comportamiento (2.1, 2.2) | WU2 (commit) | `pnpm build` | Navegar `/comercial/calendario` manualmente | Revertir el commit; reintegra el cuerpo en `CalendarioVista` |
| 3 | Widgets base: KPIs, filtro de ejecutivo, lista accionable genérica (3.1-3.3) | WU3 (commit) | `pnpm build` | N/A — aún no montados en ruta | Borrar los 3 archivos de `dashboard/componentes/` |
| 4 | Listas específicas: por aprobar, sin cotizar, por vencer (3.4-3.6) | WU4 (commit) | `pnpm build` | N/A — aún no montados en ruta | Borrar los 3 archivos de `dashboard/componentes/` |
| 5 | Vista de orquestación + wiring de `/dashboard` (4.1-4.3) | WU5 (commit) | `pnpm build` | Navegar `/dashboard` manualmente | Revertir `dashboard-content.tsx` + `page.tsx`; borrar `dashboard-vista.tsx` |
| 6 | Gate final: build + lint + verificación manual (5.1) | WU6 (commit) | `pnpm build && pnpm lint` | Checklist manual en navegador (ver 5.1) | N/A — sin cambios de código |

## 1. Tipos y utilidad de negocio aislada (base, aditivo)

- [x] 1.1 Crear `src/modulos/comercial/dashboard/tipos/dashboard.tipos.ts` con props de
      presentación para los widgets (sin identificadores `monto*`/`winRate*`, D8).
      Soporta: design D8 (guardrail presentación-only); base de las tareas 3.x.
- [x] 1.2 Crear `src/modulos/comercial/dashboard/utilidades/por-vencer.ts` con
      `esPorVencer(fechaVencimiento, ahora, horas = 72)` + `filtrarPorVencer(items)`,
      funciones puras con comentario `// DEUDA Fase 1: mover a bucket porVencer del
      backend (Fase 2)`. Soporta: spec "Lista de cotizaciones enviadas por vencer" (los
      3 escenarios); design D6 (deuda aislada y removible).

## 2. Extracción de `CalendarioPanel` (refactor presentacional del slice `calendario`)

- [x] 2.1 Crear `src/modulos/comercial/calendario/componentes/calendario-panel.tsx`
      extrayendo el cuerpo de `calendario-vista.tsx` (cabecera + leyenda + grilla +
      estados carga/error + query) sin el wrapper `PaginaListado`. Sin cambio de
      comportamiento. Soporta: design D7; habilita spec dashboard "Calendario de
      ganadas embebido". Nota: toca `calendario` como refactor puramente
      presentacional — su spec ya congelada no cambia.
- [x] 2.2 Modificar `src/modulos/comercial/calendario/vistas/calendario-vista.tsx`
      para envolver `<PaginaListado><CalendarioPanel/></PaginaListado>`, preservando
      la ruta `/comercial/calendario` intacta. Soporta: design D7.

## 3. Widgets de presentación del dashboard

- [x] 3.1 Crear `src/modulos/comercial/dashboard/componentes/dashboard-kpis.tsx`:
      Cotizaciones vía `useResumenCotizacionesQuery({ idEjecutivoResponsable })`;
      Solicitudes vía `useResumenSolicitudesQuery({})` (ámbito área); estados
      `Skeleton`/`Alert`/ceros; rótulo "Totales del área (histórico)". Soporta: spec
      "Franja de KPI del embudo" + "Rotulado explícito del alcance temporal"; design D4.
- [x] 3.2 Crear
      `src/modulos/comercial/dashboard/componentes/dashboard-filtro-ejecutivo.tsx`:
      `Select` con `useEjecutivosCotizacionesQuery()`, valor controlado por props,
      default "Todos". Soporta: spec "Filtro global de ejecutivo"; design D2.
- [x] 3.3 Crear
      `src/modulos/comercial/dashboard/componentes/dashboard-lista-accionable.tsx`:
      presentacional genérico (título, items, estados carga/error/vacío, enlace "ver
      todas"). Soporta: design D5 (base compartida de las 3 listas de la tarea 4).
- [x] 3.4 Crear
      `src/modulos/comercial/dashboard/componentes/dashboard-cotizaciones-por-aprobar.tsx`:
      `useListarCotizaciones({ bucket: "pendientesAprobacion", idEjecutivoResponsable, porPagina: 5 })`
      + `DashboardListaAccionable` con acceso al detalle. Soporta: spec "Lista de
      cotizaciones pendientes de aprobación".
- [x] 3.5 Crear
      `src/modulos/comercial/dashboard/componentes/dashboard-solicitudes-sin-cotizar.tsx`:
      `useSolicitudesClienteQuery({ bucket: "disponibles", porPagina: 5 })`, orden
      `fechaCreacion` asc, ámbito área (sin `idEjecutivoResponsable`, D-restricción)
      + `DashboardListaAccionable`. Soporta: spec "Lista de solicitudes sin cotizar".
- [x] 3.6 Crear
      `src/modulos/comercial/dashboard/componentes/dashboard-cotizaciones-por-vencer.tsx`:
      `useListarCotizaciones({ bucket: "enviadas", idEjecutivoResponsable })` +
      `filtrarPorVencer(items)` (de 1.2) + `DashboardListaAccionable`. Soporta: spec
      "Lista de cotizaciones enviadas por vencer (regla de 72 h en cliente)".

## 4. Vista de orquestación y wiring de ruta

- [x] 4.1 Crear `src/modulos/comercial/dashboard/vistas/dashboard-vista.tsx`:
      `useState<string | undefined>` para `idEjecutivoResponsable` (default = "Todos");
      compone `DashboardFiltroEjecutivo` + `DashboardKpis` + las 3 listas de 3.4-3.6 +
      `CalendarioPanel` dentro de un `Card`. Soporta: spec "Filtro global de ejecutivo"
      (recálculo) + "Calendario de ganadas embebido"; design D2/D3 (flujo de datos).
- [x] 4.2 Modificar `src/app/(privado)/comercial/page.tsx` (índice del módulo Comercial):
      reemplaza el placeholder (métricas hardcodeadas) por `<DashboardVista/>` bajo
      `SiteHeader`. Soporta: spec "Reemplazo del placeholder demo".
      (Corrección: el destino inicial fue el `/dashboard` genérico por error; el dashboard
      del área vive en el índice del módulo `/comercial`.)
- [x] 4.3 Revertir los transversales tocados por error: `dashboard-content.tsx`,
      `src/app/(privado)/dashboard/page.tsx` y el home `src/app/(privado)/page.tsx`
      vuelven a su estado original (dashboard genérico del ERP intacto). Soporta:
      corrección de alcance.

## 5. Verificación final (gate del proyecto: sin test runner)

- [x] 5.1 Ejecutar `pnpm build` y `pnpm lint` sobre el estado final; corregir errores
      de tipos y warnings de lint del código nuevo. Verificar manualmente en
      navegador: filtro "Todos"/uno recalcula KPI y las 3 listas de Cotizaciones;
      Solicitudes permanece en ámbito área; "por vencer" resalta enviadas dentro de
      72 h; `CalendarioPanel` renderiza en `/dashboard` y en `/comercial/calendario`;
      cero llamadas de red nuevas (Network tab, mismas claves de consulta). Soporta:
      `openspec/config.yaml` — `rules.verify`; spec "Composición sin duplicación de
      consultas ni cambios de backend" + "Reemplazo del placeholder demo".

## Notas

- **Cero cambios de backend/proxy.** Todos los hooks consumidos ya existen; no se
  agregan endpoints ni claves de consulta nuevas.
- **Solicitudes queda a nivel área en Fase 1** (proposal — decisión explícita): no
  crear tareas que agreguen `idEjecutivoResponsable` a los widgets de Solicitudes.
- **`por-vencer.ts` es la única deuda de negocio en cliente** (design D6): aislada,
  con comentario de deuda, trivialmente removible en Fase 2.
- El refactor de `calendario` (tareas 2.1/2.2) no cambia su spec congelada — es
  presentacional puro, verificado manualmente en `/comercial/calendario`.
