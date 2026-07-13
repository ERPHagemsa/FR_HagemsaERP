# Calendario de Cotizaciones Ganadas (frontend)

## Why

El área Comercial necesita ver sus **Cotizaciones Ganadas en un calendario** (vista
mensual estilo Google Calendar), ubicando cada servicio en su **fecha de inicio de
servicio** (y su rango, si tiene fin). Es una vista compartida para todo el equipo y
el Jefe Comercial: "qué servicios arrancan y cuándo", sin depender de anotaciones
personales.

El backend (BC03) ya expone el feed de eventos:
`GET /cotizaciones/ganadas/calendario?desde=&hasta=` → lista de
`{ id, titulo, inicio, fin, enlace }` de las Cotizaciones `GANADA` cuya fecha de
inicio de servicio cae en el rango pedido (change `fechas-servicio-y-calendario-ganadas`
en BC03, ya implementado). **Este change es el consumidor: la UI del calendario.**

## Alcance de vistas (decisión de v1)

- **v1 entrega la vista Mes**, que es la que satisface la necesidad ("ver las
  ganadas en un calendario"). Navegación mes anterior / mes siguiente / hoy.
- **Day / Week / Year quedan como follow-up** (non-goal de v1). El selector de vistas
  del mockup no se incluye todavía para no dejar controles muertos; se agrega cuando
  esas vistas existan.

## What Changes

- **Nuevo slice `src/modulos/comercial/calendario/`** (vertical slice, espeja la
  estructura de `aprobaciones`): `tipos`, `servicios`, `componentes`, `vistas`. Es
  **solo lectura** — no hay mutaciones.

- **Tipos** (`calendario.tipos.ts`): `EventoCalendario` (`{ id: string; titulo:
  string; inicio: string; fin: string | null; enlace: string }`) y `RangoCalendario`
  (`{ desde: string; hasta: string }`), reflejando el contrato del backend.

- **Servicio API** (`calendario-api.ts`): `listarEventosGanadas(rango:
  RangoCalendario): Promise<EventoCalendario[]>` → `GET
  /cotizaciones/ganadas/calendario?desde=&hasta=` vía `clienteComercial`. Sin cambios
  de proxy: el catch-all `app/api/comercial/[[...path]]` ya reenvía la ruta.

- **Query** (`calendario-queries.ts`): `useEventosCalendarioQuery(rango)` con
  `useConsulta` y clave `CLAVE_CALENDARIO_GANADAS`. Refetch al cambiar el rango
  (navegación de mes).

- **Componentes de UI**: la grilla mensual (`calendario-mensual.tsx`), la cabecera de
  navegación (`calendario-cabecera.tsx`: título del mes + anterior/siguiente/hoy) y el
  chip de evento (`evento-chip.tsx`, con click al `enlace`). Cálculo del grid con
  **date-fns** (ya es dependencia; sin librería de calendario nueva).

- **Vista + ruta**: `calendario-vista.tsx` + `src/app/(privado)/comercial/calendario/page.tsx`.

- **Sidebar**: entrada "Calendario de ganadas" en el bloque "Gestión Comercial".

- **Clave de invalidación**: `CLAVE_CALENDARIO_GANADAS` en `claves-consulta.ts`.

## Impact

- **Specs afectadas:** nueva capability `calendario`.
- **Código afectado (solo FR_HagemsaERP — frontend):**
  - `src/modulos/comercial/calendario/**` — slice nuevo completo.
  - `src/modulos/comercial/claves-consulta.ts` — nueva clave.
  - `src/app/(privado)/comercial/calendario/page.tsx` — ruta nueva.
  - `src/compartido/componentes/app-sidebar.tsx` — entrada de navegación.
- **Sin cambios de backend** (el feed ya existe) ni de proxy (catch-all ya reenvía).
- **Tema oscuro:** el calendario respeta el tema claro/oscuro global de la app (el
  toggle del mockup reusa el switch de tema existente; no se agrega estado de tema
  por página).
- **Entrega:** commits directos a `desarrollo`, sin PRs (convención del repo). Gate:
  `pnpm build` + `pnpm lint` (no hay test runner).
