# Tareas: Calendario de Cotizaciones Ganadas (frontend)

> Slice nuevo `calendario` de solo lectura que consume el feed del BC03. Orden por
> dependencia: tipos → servicio/query → componentes → vista/ruta → sidebar. Entrega:
> commits directos a `desarrollo`, sin PRs. Sin test runner: gate = `pnpm build` +
> `pnpm lint`.

## 1. Tipos y clave de invalidación (base, aditivo)

- [x] 1.1 Crear `src/modulos/comercial/calendario/tipos/calendario.tipos.ts` con
      `EventoCalendario` (`{ id: string; titulo: string; inicio: string; fin: string | null; enlace: string }`)
      y `RangoCalendario` (`{ desde: string; hasta: string }`), reflejando el contrato del backend.
      Soporta: spec `calendario` — todas las requirements (vocabulario del slice); design D3.
- [x] 1.2 En `src/modulos/comercial/claves-consulta.ts`, agregar
      `CLAVE_CALENDARIO_GANADAS = "comercial/cotizaciones/calendario-ganadas"` (convención `comercial/<recurso>`).
      Soporta: design D3 (clave de la query).

## 2. Servicio API y query (capa de datos)

- [x] 2.1 Crear `src/modulos/comercial/calendario/servicios/calendario-api.ts` con
      `listarEventosGanadas(rango: RangoCalendario): Promise<EventoCalendario[]>` →
      `GET /cotizaciones/ganadas/calendario?desde=&hasta=` vía `clienteComercial` (array pelado, sin envelope).
      Clonar el estilo por-contrato de `cotizaciones/servicios/cotizaciones-api.ts` (comentario con método/ruta/status).
      Soporta: spec `calendario` — "Consumo del feed del backend por rango visible"; design D2/D3.
      Nota: cero cambios de proxy — el catch-all `app/api/comercial/[[...path]]` ya reenvía la ruta.
- [x] 2.2 Crear `src/modulos/comercial/calendario/servicios/calendario-queries.ts` con
      `useEventosCalendarioQuery(rango: RangoCalendario)` usando `useConsulta` (clave `CLAVE_CALENDARIO_GANADAS`
      + el rango como parte de la clave/deps para refetch al cambiar de mes), delegando en `listarEventosGanadas`.
      Soporta: spec `calendario` — "Consumo del feed…" (escenarios carga/error) y "Navegación temporal"
      (refetch por rango); design D2.

## 3. Componentes de UI

- [x] 3.1 Crear `src/modulos/comercial/calendario/componentes/evento-chip.tsx`: chip con el `titulo`,
      `onClick` que navega al detalle (`router.push` a la ruta interna derivada del `enlace`, ver design D-riesgo 4).
      Clonar acentos/tokens de tema existentes (respeta claro/oscuro, design D5).
      Soporta: spec `calendario` — "Vista mensual" (escenario click → detalle).
- [x] 3.2 Crear `src/modulos/comercial/calendario/componentes/calendario-cabecera.tsx`: título del mes
      (`format(mesVisible, "LLLL yyyy")` con locale es), botones anterior/siguiente/hoy (props
      `alAnterior`/`alSiguiente`/`alHoy`). Sin selector Day/Week/Year (fuera de v1, ver proposal).
      Soporta: spec `calendario` — "Navegación temporal" (ambos escenarios).
- [x] 3.3 Crear `src/modulos/comercial/calendario/componentes/calendario-mensual.tsx`: grilla 7×N con
      `date-fns` (`startOfWeek(startOfMonth)`..`endOfWeek(endOfMonth)`, `eachDayOfInterval`), cabecera de
      días de semana, celda por día que resalta "hoy" y atenúa los días fuera del mes; recibe `eventosPorDia`
      (Map/dict fecha→`EventoCalendario[]`) y renderiza `EventoChip` por evento. Colocación por día abarcado
      (design D4): un evento con `fin` aparece en cada día del rango recortado al visible. Densidad: mostrar
      hasta N chips por celda y un "+X más" (design D-riesgo 3).
      Soporta: spec `calendario` — "Vista mensual" (eventos en su día, evento de rango, mes vacío).

## 4. Vista, ruta y sidebar

- [x] 4.1 Crear `src/modulos/comercial/calendario/vistas/calendario-vista.tsx`: estado `mesVisible`;
      calcula `rango = { desde: startOfWeek(startOfMonth(mesVisible)), hasta: endOfWeek(endOfMonth(mesVisible)) }`;
      consume `useEventosCalendarioQuery(rango)`; agrupa los eventos por día (expandiendo rangos inicio..fin);
      compone `CalendarioCabecera` + `CalendarioMensual`. Estados: `isLoading` → `Skeleton` en la grilla;
      `isError` → `Alert` con `extraerMensajeError` + reintento (clonar `cotizaciones-vista.tsx`).
      Soporta: spec `calendario` — "Vista mensual", "Navegación temporal", "Consumo del feed…" (carga/error);
      design D2/D6.
- [x] 4.2 Crear `src/app/(privado)/comercial/calendario/page.tsx`: server component con `<SiteHeader>`
      (breadcrumb "Gestión Comercial" → "Calendario de ganadas") + `<CalendarioVista/>`. Clonar
      `app/(privado)/comercial/cotizaciones/page.tsx` simplificado (sin `[id]` ni `searchParams` de filtros).
      Soporta: spec `calendario` — "Ruta y navegación del calendario".
- [x] 4.3 En `src/compartido/componentes/app-sidebar.tsx`, dentro del bloque "Gestión Comercial", agregar
      `{ title: "Calendario de ganadas", url: "/comercial/calendario" }`.
      Soporta: spec `calendario` — "Ruta y navegación del calendario" (escenario "Acceso desde el sidebar").

## 5. Verificación final (gate del proyecto: sin test runner)

- [x] 5.1 Ejecutar `pnpm build` y `pnpm lint` sobre el estado final; corregir errores de tipos y warnings
      de lint del código nuevo antes de cerrar apply. Es el gate definido en `openspec/config.yaml`
      (`rules.verify`); no hay test runner. Verificar manualmente en el navegador: navegación de meses,
      evento de un día, evento de rango, click al detalle, mes vacío, y tema oscuro.
      Soporta: `openspec/config.yaml` — `rules.apply`, `rules.verify`.
      **Resultado**: `pnpm build` verde (ruta `/comercial/calendario` generada, sin errores de tipos).
      `pnpm lint` sin errores/warnings nuevos: 121 problemas (99 errores, 22 warnings) tanto en la base
      (`origin/desarrollo`, verificado con `git stash`) como con el slice aplicado — deuda 100%
      preexistente en `activos`, `administracion`, `configuracion-general`, `perfil`, `socio-negocios`;
      ninguno en `calendario/`, `app-sidebar.tsx` ni `claves-consulta.ts`.
      **Pendiente**: la verificación manual en navegador (navegación de meses, evento de un día, evento
      de rango, click al detalle, mes vacío, tema oscuro) no se ejecutó en este entorno (sin browser
      disponible) — queda a cargo del usuario antes de dar por cerrado el cambio.

---

## Work Units (commits convencionales, sin PRs — entrega directa a `desarrollo`)

Cada unidad es un commit independiente con `pnpm build` verde al terminar.

| # | Commit (Conventional Commits) | Tareas | Motivo de agrupación |
|---|-------------------------------|--------|----------------------|
| WU1 | `feat(calendario): tipos, clave, servicio API y query del slice` | 1.1, 1.2, 2.1, 2.2 | Capa de datos pura del slice nuevo, verificable con `tsc`/build; sin UI. |
| WU2 | `feat(calendario): componentes de grilla mensual (cabecera, grilla, chip)` | 3.1, 3.2, 3.3 | Los tres componentes de presentación forman una unidad; la grilla depende del chip y la cabecera. |
| WU3 | `feat(calendario): vista, ruta y entrada de sidebar` | 4.1, 4.2, 4.3 | Cierra el slice como feature navegable de punta a punta. |
| WU4 | `chore(calendario): verificar build y lint` | 5.1 | Gate final, sin cambios de producto. |

## Notas

- **Solo lectura.** No hay mutaciones ni `use-mutar`. El único dato lo captura el
  backend al ganar; el calendario nunca crea/edita/mueve eventos.
- **Sin cambios de backend ni de proxy.** El feed `GET /cotizaciones/ganadas/calendario`
  y el catch-all ya existen.
- **v1 = vista Mes.** Day/Week/Year son follow-up (proposal + design D1/riesgo 1). No
  agregar el selector de vistas hasta que esas vistas existan.
- **El front no computa nada del dominio.** Solo agrupa por día los eventos que
  devuelve el feed (expandiendo `inicio..fin`); no filtra por usuario ni recalcula
  fechas de negocio.

## Review Workload Forecast

- **Líneas cambiadas estimadas**: ~350-450 (slice nuevo de ~7 archivos + 3 retoques
  chicos: clave, ruta, sidebar). El WU más grande es WU2 (grilla), ~200 líneas.
- **Chained PRs recommended: No.** Entrega por commits directos a `desarrollo`, sin
  PRs (convención del repo). Cada Work Unit es un commit atómico con build verde.
- **400-line budget risk: Low.** Ningún commit se acerca a 400 líneas.
- **Decision needed before apply: Sí (una).** Confirmar el alcance de vistas: v1 solo
  Mes (recomendado) vs incluir Day/Week/Year desde el inicio. El resto está cerrado en
  el design.
