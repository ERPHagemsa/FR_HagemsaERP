# Design — Calendario de Cotizaciones Ganadas (frontend)

## Context

El módulo Comercial (`src/modulos/comercial`) es feature-first: cada slice
(`cotizaciones`, `aprobaciones`, `contratos`, …) tiene `tipos`, `servicios`,
`componentes`, `vistas`. El acceso a datos es vía `useConsulta`/`invalidarConsulta`
(`src/compartido/api`, reemplazan TanStack Query) sobre clientes BFF preconfigurados
(`clienteComercial` → `/api/comercial/*`, catch-all que reenvía al BC03). Las claves
de invalidación viven centralizadas en `src/modulos/comercial/claves-consulta.ts`.
No hay test runner: el gate es `pnpm build` + `pnpm lint`. Entrega: commits directos
a `desarrollo`, sin PRs.

Este change agrega un slice `calendario` de **solo lectura** que consume el feed del
BC03 y lo pinta como grilla mensual.

## Goals / Non-Goals

**Goals**
- Vista Mes de las Cotizaciones Ganadas, ubicadas por fecha de inicio de servicio.
- Navegación mes anterior/siguiente/hoy, con refetch por rango visible.
- Click en evento → detalle de la cotización.
- Respetar el tema claro/oscuro global.

**Non-Goals**
- Vistas Day / Week / Year (follow-up; v1 es solo Mes).
- Crear/editar/mover eventos (el calendario es solo lectura; el dato se captura al
  ganar, en el backend).
- Cualquier cambio de backend o de proxy (el feed y el catch-all ya existen).
- Gating de permisos client-side (visibilidad de área; el backend controla acceso).

## Decisions

### D1 — Grilla propia con date-fns (sin librería de calendario)

El proyecto ya usa `date-fns` y no tiene librería de calendario. La grilla mensual es
simple de derivar (`startOfMonth`/`endOfMonth`/`startOfWeek`/`endOfWeek`/`eachDayOfInterval`),
así que se construye a mano. **Descartado** agregar `react-big-calendar`/`FullCalendar`:
nueva dependencia pesada, estilos a domar, y para una vista Mes de solo lectura el
costo supera al beneficio.

### D2 — El rango pedido es la grilla visible completa, no solo el mes

La grilla mensual muestra días de relleno del mes anterior/siguiente (semanas
completas). El feed se pide con `desde = startOfWeek(startOfMonth(mes))` y `hasta =
endOfWeek(endOfMonth(mes))`, para que los eventos que caen en esos días de relleno
también se pinten. El formato de `desde`/`hasta` sigue la convención de fecha del
backend (ISO date); alinear el borde con la misma convención para no perder/duplicar
eventos en el límite.

### D3 — Slice `calendario` nuevo, espejo de `aprobaciones`

Estructura:
```
src/modulos/comercial/calendario/
  tipos/calendario.tipos.ts          # EventoCalendario, RangoCalendario
  servicios/calendario-api.ts        # listarEventosGanadas(rango) → clienteComercial
  servicios/calendario-queries.ts    # useEventosCalendarioQuery(rango)
  componentes/calendario-cabecera.tsx  # título del mes + anterior/siguiente/hoy
  componentes/calendario-mensual.tsx   # grilla 7×N con celdas de día
  componentes/evento-chip.tsx          # chip con título + click al enlace
  vistas/calendario-vista.tsx          # compone cabecera + grilla + query + estados
```
Read-only: no hay `use-mutar`, ni claves de invalidación cruzada más allá de la
propia `CLAVE_CALENDARIO_GANADAS` (que en la práctica casi no se invalida — el dato
solo cambia al ganar una cotización, en otra pantalla).

### D4 — Colocación de eventos: por día que abarca (no barras spanning)

- Evento de un día (sin `fin`): chip en la celda de `inicio`.
- Evento de rango (con `fin`): chip en **cada** celda del intervalo `inicio..fin`
  recortado al rango visible. Es más simple que barras que cruzan celdas (spanning) y
  comunica el rango igual. Barras spanning quedan como pulido opcional (follow-up).

### D5 — Tema

El calendario usa las clases/tokens de tema existentes (shadcn/tailwind); respeta el
tema claro/oscuro global. El toggle de luna del mockup **reusa** el switch de tema ya
presente en la app; no se agrega estado de tema local a esta vista.

### D6 — Estados de carga/error/vacío

Clonar el patrón de las vistas existentes (`cotizaciones-vista.tsx`): `isLoading` →
`Skeleton` en la grilla; `isError` → `Alert` con `extraerMensajeError` y reintento;
vacío → grilla renderizada sin chips (no es un "empty state" de página, es un mes sin
eventos).

## Data flow

```
CalendarioVista (estado: mesVisible)
  rango = { desde: startOfWeek(startOfMonth(mesVisible)),
            hasta: endOfWeek(endOfMonth(mesVisible)) }
  useEventosCalendarioQuery(rango)  ── useConsulta(CLAVE_CALENDARIO_GANADAS, () =>
      listarEventosGanadas(rango))
        └── GET /api/comercial/cotizaciones/ganadas/calendario?desde=&hasta=
              (clienteComercial → catch-all → BC03)
  CalendarioMensual(dias, eventosPorDia)  → celdas → EventoChip(onClick → router.push(enlace))
  CalendarioCabecera(mesVisible, alAnterior, alSiguiente, alHoy)
```

## Risks / Open questions

1. **Alcance de vistas.** v1 entrega solo Mes; Day/Week/Year son follow-up. Si el
   negocio los quiere ya, es más trabajo (otra iteración) — confirmar antes de
   ampliar.
2. **Zona horaria en el borde del mes.** El `desde`/`hasta` debe alinearse con la
   convención de fecha del backend para no perder eventos en los días límite (D2).
3. **Densidad de eventos por día.** Si un día tiene muchos eventos, la celda puede
   desbordar. v1: mostrar hasta N chips y un "+X más" (patrón calendario estándar);
   el "+X más" que expande queda como pulido si hace falta.
4. **`enlace` del backend.** El evento trae un `enlace` al detalle. Si es una URL
   absoluta del sistema, el click puede resolverse con `router.push` a la ruta
   interna `/comercial/cotizaciones/:id`; confirmar la forma exacta del `enlace` al
   integrar (contrato con el backend, documentado en `API-Cotizaciones.md`).
