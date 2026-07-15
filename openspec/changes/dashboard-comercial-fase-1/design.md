# Design — Dashboard Comercial Fase 1 (frontend)

## Context

El módulo Comercial (`src/modulos/comercial`) es feature-first: cada slice
(`cotizaciones`, `solicitudes-cliente`, `calendario`, …) expone `tipos`,
`servicios`, `componentes`, `vistas`. El acceso a datos es vía
`useConsulta`/`useMutar` (`src/compartido/api`) con claves centralizadas en
`claves-consulta.ts`. No hay test runner: el gate es `pnpm build` + `pnpm lint`.

Este change agrega un slice `dashboard` de **solo lectura y composición**: no crea
consultas nuevas, reutiliza los hooks de resumen/listado ya consumidos por las
tablas de Cotizaciones y Solicitudes.

## Restricción verificada (condiciona el diseño)

`FiltrosResumenCotizaciones` y `FiltrosCotizaciones` aceptan
`idEjecutivoResponsable`; **`FiltrosResumenSolicitudes` y `FiltrosSolicitudesCliente`
NO**. El filtro de ejecutivo solo puede propagarse a los widgets de Cotizaciones.
Es coherente con el negocio: las solicitudes `PENDIENTE` son demanda entrante sin
dueño asignado, por lo que filtrarlas por ejecutivo no tendría sentido en Fase 1.

## Decisions

### D1 — Sin capa `servicios/` en el slice

El dashboard **no** define `servicios/`; consume directamente los hooks de los
módulos origen (`useResumenCotizacionesQuery`, `useResumenSolicitudesQuery`,
`useListarCotizaciones`, `useSolicitudesClienteQuery`, `useEjecutivosCotizacionesQuery`).
Rationale: agregar `servicios/` obligaría a envolver o duplicar consultas —lo que
el proposal prohíbe—. **Descartado** un barrel de re-export: no aporta y esconde el
origen del dato. La ausencia de `servicios/` es además una **barrera estructural**:
no hay dónde colar una llamada de agregación nueva.

### D2 — Estado del filtro de ejecutivo: `useState` elevado en la vista

`idEjecutivoResponsable` vive como estado local en `DashboardVista` y baja por
props a los widgets; cada widget conserva su propia query (keyed por ese valor).
Espeja el patrón de `calendario-vista.tsx` y `cotizaciones-tabla.tsx` (estado
local, sin nubes de estado global). **Descartado** URL search param / `nuqs` (no
instalado): el dashboard es una pantalla de arranque personal; la deep-linkability
del filtro es de bajo valor y añadiría un boundary `Suspense`. Queda anotado como
mejora diferible sin costo de rediseño (solo cambiar el origen del estado).

### D3 — `DashboardContent` como shell de layout; la lógica vive en la vista

Para respetar la dirección de dependencias (compartido **no** importa `modulos`),
`dashboard-content.tsx` pasa a ser un contenedor presentacional que recibe
`children`; `page.tsx` inyecta el módulo:
`<DashboardContent><DashboardVista/></DashboardContent>`. Así `compartido/` queda
libre de lógica de módulo y el placeholder demo (`SectionCards`/`ChartAreaInteractive`)
desaparece. **Descartado** que `DashboardContent` importe la vista directamente
(invierte el layering).

### D4 — Franja de KPI presentacional; conteos rotulados all-time

`DashboardKpis` reusa el patrón visual de `cotizaciones-kpis.tsx` (tarjeta
`rounded` + `Skeleton` en carga), pero **no clicable**: son indicadores, no filtros.
Cotizaciones alimenta desde `useResumenCotizacionesQuery({ idEjecutivoResponsable })`;
Solicitudes desde `useResumenSolicitudesQuery({})` (ámbito área, sin ejecutivo — D-restricción).
Estados: `isLoading` → `Skeleton`; `isError` → `Alert` con `extraerMensajeError`;
vacío → ceros. Etiqueta explícita "Totales del área (histórico)" para no leerse
como "del mes".

### D5 — Listas accionables mapeadas 1:1 a un hook + filtro

| Lista | Hook + filtro | Ámbito ejecutivo |
|-------|---------------|------------------|
| Cotizaciones por aprobar | `useListarCotizaciones({ bucket: "pendientesAprobacion", idEjecutivoResponsable, porPagina: N })` | Sí |
| Solicitudes sin cotizar | `useSolicitudesClienteQuery({ bucket: "disponibles", porPagina: N })`, más antiguas primero | No (área) |
| Cotizaciones por vencer | `useListarCotizaciones({ bucket: "enviadas", idEjecutivoResponsable })` + `filtrarPorVencer(...)` | Sí |

`DashboardListaAccionable` es un presentacional genérico (título, items, estados
carga/error/vacío, enlace "ver todas" al listado del módulo).

### D6 — Regla "por vencer" 72 h aislada y removible

`utilidades/por-vencer.ts` es la **única** deuda de negocio en cliente: función
pura `esPorVencer(fechaVencimiento, ahora, horas = 72)` + `filtrarPorVencer(items)`,
con banner `// DEUDA Fase 1: mover a bucket porVencer del backend (Fase 2)`. Fichero
autocontenido: Fase 2 lo borra y cambia el widget a un bucket backend. No calcula
dinero ni win rate: solo compara fechas.

### D7 — Calendario: extraer `CalendarioPanel` (refactor presentacional, sin tocar el spec)

`CalendarioVista` envuelve su cuerpo en `PaginaListado` (chrome de página), que no
encaja como widget. Se extrae el cuerpo (cabecera + leyenda + grilla + estados +
query) a un `CalendarioPanel` sin `PaginaListado`; `CalendarioVista` queda como
`<PaginaListado><CalendarioPanel/></PaginaListado>` y el dashboard monta
`<CalendarioPanel/>` dentro de un `Card`. Es un refactor de componentes **sin cambio
de comportamiento** → la capability/spec `calendario` no cambia. **Descartado**
embeber `CalendarioVista` tal cual (arrastra el wrapper) y **descartado** duplicar
la query en el dashboard (repite la lógica de agrupación D4 del calendario).

### D8 — Guardrail presentación-only

Sin `servicios/` (D1); `tipos/` solo props de presentación; `montoTotal` se
**formatea** si se muestra, nunca se **suma**; nombres por intención de UI
(`por-aprobar`, `sin-cotizar`, `por-vencer`) sin identificadores `monto*`/`winRate*`.
Regla: presentación sí, agregación de negocio no (Fase 2 backend).

## File layout

```
src/modulos/comercial/dashboard/
  tipos/dashboard.tipos.ts                       # props de widgets (presentación)
  utilidades/por-vencer.ts                        # DEUDA 72h aislada (D6)
  componentes/dashboard-kpis.tsx                  # franja KPI (D4)
  componentes/dashboard-filtro-ejecutivo.tsx      # Select Todos/uno (D2)
  componentes/dashboard-lista-accionable.tsx      # lista genérica (D5)
  componentes/dashboard-cotizaciones-por-aprobar.tsx
  componentes/dashboard-solicitudes-sin-cotizar.tsx
  componentes/dashboard-cotizaciones-por-vencer.tsx
  vistas/dashboard-vista.tsx                      # orquesta estado ejecutivo + widgets
src/modulos/comercial/calendario/componentes/calendario-panel.tsx  # extraído (D7)
```

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/modulos/comercial/dashboard/**` | Create | Slice nuevo (widgets, tipos, helper, vista). |
| `calendario/componentes/calendario-panel.tsx` | Create | Cuerpo embebible extraído. |
| `calendario/vistas/calendario-vista.tsx` | Modify | Envuelve `CalendarioPanel` (sin cambio de comportamiento). |
| `compartido/componentes/dashboard-content.tsx` | Modify | Pasa a shell de layout con `children` (D3). |
| `src/app/(privado)/dashboard/page.tsx` | Modify | Inyecta `<DashboardVista/>` como children. |
| `compartido/componentes/section-cards.tsx`, `chart-area-interactive.tsx` | Reused/removed from route | Ya no se montan en `/dashboard`; sin borrar aquí. |

## Data flow

```
DashboardVista (estado: idEjecutivoResponsable)
 ├─ DashboardFiltroEjecutivo ── useEjecutivosCotizacionesQuery()   (setea el estado)
 ├─ DashboardKpis
 │    ├─ useResumenCotizacionesQuery({ idEjecutivoResponsable })   → ResumenCotizaciones
 │    └─ useResumenSolicitudesQuery({})                             → ResumenSolicitudesCliente (área)
 ├─ DashboardCotizacionesPorAprobar ── useListarCotizaciones({ bucket:"pendientesAprobacion", idEjecutivoResponsable })
 ├─ DashboardSolicitudesSinCotizar   ── useSolicitudesClienteQuery({ bucket:"disponibles" })  (área)
 ├─ DashboardCotizacionesPorVencer   ── useListarCotizaciones({ bucket:"enviadas", idEjecutivoResponsable })
 │                                        └─ filtrarPorVencer(items, 72h)   [DEUDA Fase 1]
 └─ CalendarioPanel (reuso; sin re-especificar calendario)
```

## Testing strategy

Sin test runner (Standard Mode). Gate: `pnpm build` + `pnpm lint`. Verificación
manual: filtro Todos/uno recalcula KPI y listas de Cotizaciones; solicitudes quedan
en ámbito área; "por vencer" resalta enviadas dentro de 72 h; calendario embebido
renderiza; cero llamadas nuevas de red (reusa claves de consulta existentes).

## Threat Matrix

N/A — no hay routing dinámico, shell, subprocess, automatización VCS/PR,
clasificación de ejecutables ni integración de procesos.

## Migration / Rollout

No requiere migración. Cambio aditivo y aislado (proposal §Rollback): revertir
`dashboard-content.tsx` + `page.tsx`, borrar el slice `dashboard` y el
`calendario-panel` (reintegrar su cuerpo en la vista) restaura el placeholder.

## Open Questions

- [ ] `N` (tamaño de página) por lista accionable — sugerido 5; confirmar con negocio.
- [ ] Orden "más antiguas primero" de solicitudes: confirmar si el backend ya
      ordena por `fechaCreacion` asc o se ordena en cliente sobre la página devuelta.
- [ ] Deep-link "ver todas": confirmar ruta y query destino de cada listado.
