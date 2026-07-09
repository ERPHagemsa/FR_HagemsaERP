# Tareas: Loop de aprobación de cotizaciones (BC03 Épica 2) en el frontend

> Orden por dependencia real: los `switch` exhaustivos sobre `EstadoCotizacion` rompen el
> `pnpm build` en cuanto se agrega el valor `PENDIENTE_APROBACION` al enum, hasta que se cubran
> todos los `case`. Por eso la Fase 1 va primero y agrupa enum + ambos switches en una sola
> unidad de commit (ver `## Work Units`). Entrega: commits directos a `desarrollo`, sin PRs.

## 1. Tipos base — enum y switches exhaustivos (bloquea todo lo demás)

- [x] 1.1 En `src/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos.ts`, agregar
      `"PENDIENTE_APROBACION"` a la unión `EstadoCotizacion` (línea ~24-31).
      Soporta: spec `cotizaciones` — "Estado PENDIENTE_APROBACION en el modelo de estados".
- [x] 1.2 En el mismo archivo, agregar el `case "PENDIENTE_APROBACION"` en
      `accionesPermitidas()` (línea ~681-695): `{ editar: false, enviar: false, nuevaVersion: false,
      ganar: false, perder: false, cancelar: false }` (todo bloqueado mientras espera aprobación).
      Soporta: spec `cotizaciones` — escenario "Acciones bloqueadas mientras espera aprobación";
      design D-implícito (no hay D específico, es consecuencia directa de A4 de la propuesta).
      **Debe ir en el mismo commit que 1.1** — sin este case el build falla (switch no exhaustivo).
- [x] 1.3 En `src/modulos/comercial/cotizaciones/componentes/estado-cotizacion-badge.tsx`,
      agregar el `case "PENDIENTE_APROBACION"` en `variantPorEstado()` (variant `"outline"`) y en
      `etiquetaPorEstado()` (etiqueta `"Pendiente de aprobación"`).
      Soporta: spec `cotizaciones` — escenario "Badge de una cotización pendiente de aprobación".
      **Debe ir en el mismo commit que 1.1/1.2** — mismo motivo (switch exhaustivo, build roto si falta).

## 2. Tipos base — KPI y bucket (aditivo, no rompe build)

- [x] 2.1 En `cotizaciones.tipos.ts`, agregar `"pendientesAprobacion"` a `BucketCotizacion`
      (línea ~44-48).
      Soporta: spec `cotizaciones` — "KPI de pendientes de aprobación", escenario "Bucket
      navegable como el resto de KPIs".
- [x] 2.2 En el mismo archivo, agregar `pendientesAprobacion: number` a `ResumenCotizaciones`
      (línea ~333-339).
      Soporta: spec `cotizaciones` — escenario "Tarjeta de KPI muestra el valor del backend".
      Nota: `TARJETAS` en `cotizaciones-kpis.tsx` es un array manual (no un switch exhaustivo
      sobre el tipo), así que agregar el bucket/campo aquí NO rompe el build por sí solo —
      queda pendiente hasta la tarea 4.2.

## 3. Slice `aprobaciones` — tipos y schemas (archivos nuevos, aditivo)

- [x] 3.1 Crear `src/modulos/comercial/aprobaciones/tipos/aprobaciones.tipos.ts` con
      `EstadoSolicitud`, `SolicitudAprobacion`, `ItemBandejaAprobacion`,
      `RespuestaPaginadaAprobaciones`, `PayloadAprobar`, `PayloadRechazar`, `PayloadObservar`
      (contrato exacto en design.md, sección "Contrato de tipos").
      Soporta: spec `aprobaciones` — todos los requisitos (define el vocabulario del slice);
      design: sección "Contrato de tipos".
- [x] 3.2 Crear `src/modulos/comercial/aprobaciones/tipos/aprobaciones.schemas.ts` con
      `schemaAprobar` (comentario opcional), `schemaRechazar` (`motivo` string `.trim().min(1,
      "El motivo es obligatorio.")`), `schemaObservar` (`comentario` string `.trim().min(1, "El
      comentario es obligatorio.")`).
      Soporta: spec `aprobaciones` — "Rechazar una solicitud" (escenario "Motivo vacío bloqueado
      en cliente"), "Observar una solicitud" (escenario "Comentario vacío bloqueado en cliente");
      design: bloque zod en "Contrato de tipos". Restricción: sin reglas de negocio propias más
      allá de "no vacío" (non-goal explícito de la propuesta).

## 4. Retoques aditivos al slice `cotizaciones` (KPI + pipeline)

- [x] 4.1 En `src/modulos/comercial/cotizaciones/vistas/cotizacion-detalle-vista.tsx`, corregir
      `Pipeline()` (línea ~201-248): insertar el paso `PENDIENTE_APROBACION` ("Pendiente de
      aprobación") entre `"Borrador"` y `"Enviada"` en el array `pasos`, de forma que
      `indiceActual` deje de resolver en `-1` para ese estado. Mantener el early-return a
      `EstadoCotizacionBadge` solo para `CANCELADA` / `VENCIDA` / `EN_REVISION`.
      Soporta: spec `cotizaciones` — "Pipeline del detalle contempla PENDIENTE_APROBACION",
      escenario "Pipeline resalta el paso de aprobación"; design: tabla "Integración con
      cotizaciones" (bug fix explícito).
- [x] 4.2 En `src/modulos/comercial/cotizaciones/componentes/cotizaciones-kpis.tsx`, agregar
      una 5.ª entrada a `TARJETAS` para `bucket: "pendientesAprobacion"` (etiqueta "Pendientes de
      aprobación", icono `ClipboardCheck` de `lucide-react`, acento ámbar/índigo propio — no
      reusar clase de otra tarjeta) y cambiar el grid de `grid-cols-2 sm:grid-cols-4` a
      `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` (línea ~85).
      Soporta: spec `cotizaciones` — "KPI de pendientes de aprobación", ambos escenarios;
      design D4 (breakpoint) y D5 (el valor viene solo de `/cotizaciones/resumen`, nunca se
      computa en el front — ya lo garantiza `useResumenCotizacionesQuery`, no tocar esa query).

## 5. Contrato `enviar` → `solicitar aprobación` (cambio no aditivo, A1)

- [x] 5.1 En `src/modulos/comercial/cotizaciones/servicios/cotizaciones-api.ts`, **renombrar
      `enviarCotizacion` → `solicitarAprobacion`** (línea ~129-134) y cambiar su firma de
      `Promise<void>` a `Promise<{ id: string }>`, devolviendo `data` de la respuesta `201`.
      Actualizar el comentario de contrato: `POST /cotizaciones/:id/enviar → 201 { id }` (el `id`
      es de la `SolicitudAprobacion`, no de la cotización — documentarlo en el comentario).
      La **ruta HTTP no cambia**; el rename es solo del lado del front.
      Soporta: spec `cotizaciones` (delta MODIFIED) — "Solicitar aprobación de una cotización",
      escenario "Solicitud de aprobación exitosa"; design D1 (se queda en `cotizaciones-api.ts`,
      NO se mueve a `aprobaciones-api.ts`, y se renombra).
- [x] 5.2 En `src/modulos/comercial/cotizaciones/servicios/cotizaciones-queries.ts`, renombrar
      `useEnviarCotizacionMutation` → `useSolicitarAprobacionMutation` (línea ~153-165) y
      actualizar la llamada a la función renombrada de 5.1.
      Soporta: design D1 (call-site 1 de 2).
      **Depende de 5.1.** La invalidación de este hook se completa en la tarea 8.3.
- [x] 5.3 En `src/modulos/comercial/cotizaciones/componentes/cotizacion-acciones.tsx`, en
      `DialogEnviar` (línea ~188-301): consumir el hook renombrado
      (`useSolicitarAprobacionMutation`), y cambiar el label del botón trigger de "Enviar" a
      "Solicitar aprobación", el `DialogTitle` de "Enviar cotizacion" a "Solicitar aprobación", la
      `DialogDescription` (ya no debe decir "quedará enviada" ni "quedará congelada" — reemplazar
      por copy honesto tipo "Se abrirá una solicitud de aprobación; la cotización quedará
      pendiente hasta que se resuelva"), el texto del botón de submit ("Confirmar envio" →
      "Confirmar solicitud") y el mensaje de éxito en `CotizacionAcciones` (línea 88, actualmente
      "Cotizacion enviada correctamente" → "Solicitud de aprobación enviada").
      Renombrar también el componente `DialogEnviar` → `DialogSolicitarAprobacion` y la clave
      `acciones.enviar` sigue llamándose igual (viene de `accionesPermitidas`, no se toca).
      Soporta: spec `cotizaciones` — escenario "Solicitud de aprobación exitosa" ("el copy de
      éxito DEBE indicar que se solicitó aprobación, no que se envió"); propuesta — riesgo
      "Cambio de semántica de una acción en uso"; design D1 (call-site 2 de 2).
      **Depende de 5.2.**

## 6. Claves de invalidación nuevas

- [x] 6.1 En `src/modulos/comercial/claves-consulta.ts`, agregar
      `CLAVE_APROBACIONES_PENDIENTES = "comercial/aprobaciones/pendientes"` y
      `CLAVE_COTIZACION_APROBACIONES_HISTORIAL = "comercial/cotizaciones/aprobaciones-historial"`.
      Soporta: design — sección "Estrategia de invalidación (CRÍTICO)".

## 7. Slice `aprobaciones` — servicios API

- [x] 7.1 Crear `src/modulos/comercial/aprobaciones/servicios/aprobaciones-api.ts` con:
      `aprobarSolicitud(id, payload?: PayloadAprobar): Promise<void>` (`POST
      /aprobaciones/:id/aprobar` → 204), `rechazarSolicitud(id, payload: PayloadRechazar):
      Promise<void>` (`POST /aprobaciones/:id/rechazar` → 204), `observarSolicitud(id, payload:
      PayloadObservar): Promise<void>` (`POST /aprobaciones/:id/observar` → 204),
      `listarPendientes(params: { pagina; porPagina }): Promise<RespuestaPaginadaAprobaciones>`
      (`GET /aprobaciones/pendientes`), `obtenerHistorialAprobaciones(idCotizacion): Promise<
      SolicitudAprobacion[]>` (`GET /cotizaciones/:id/aprobaciones` — array pelado, sin
      envelope). Clonar el estilo documentado por contrato de `cotizaciones-api.ts` (comentario
      de header con método/ruta/status por función), usando `clienteComercial`.
      Soporta: spec `aprobaciones` — "Bandeja de solicitudes pendientes", "Aprobar una
      solicitud", "Rechazar una solicitud", "Observar una solicitud", "Historial de solicitudes
      de una cotización"; design: bloque `aprobaciones-api.ts`. Cero cambios de proxy — el
      catch-all ya reenvía estas rutas.

## 8. Slice `aprobaciones` — hooks e invalidación centralizada

- [x] 8.1 Crear `src/modulos/comercial/aprobaciones/servicios/aprobaciones-queries.ts` con:
      `useAprobacionesPendientesQuery(params)` (clave `CLAVE_APROBACIONES_PENDIENTES`),
      `useHistorialAprobacionesQuery(idCotizacion)` (clave
      `CLAVE_COTIZACION_APROBACIONES_HISTORIAL`), y el helper privado
      `invalidarTrasResolver()` que invalida en bloque las **cinco** claves:
      `CLAVE_APROBACIONES_PENDIENTES`, `CLAVE_COTIZACIONES`, `CLAVE_COTIZACIONES_RESUMEN`,
      `CLAVE_COTIZACION_DETALLE` y `CLAVE_COTIZACION_APROBACIONES_HISTORIAL`.
      La última es la que se olvida: resolver cambia el `estado` de la solicitud, que es
      exactamente lo que renderiza `historial-aprobaciones`. Sin ella, quien resuelve desde el
      detalle ve el badge de la cotización actualizado y el historial congelado en `EN_APROBACION`.
      Soporta: design — sección "Estrategia de invalidación (CRÍTICO)" (fuente única de verdad
      de invalidación tras resolver).
- [x] 8.2 En el mismo archivo, `useAprobarMutation()`, `useRechazarMutation()`,
      `useObservarMutation()` — las tres `onSuccess` llaman `invalidarTrasResolver()` y muestran
      `toast.success`. Manejo de error: en el catch del componente que las consuma (no acá) se
      debe distinguir `esError409(error)` → mensaje inline "la solicitud ya fue resuelta por otra
      operación" + `invalidarConsulta(CLAVE_APROBACIONES_PENDIENTES)` (para que la fila
      desaparezca); `422` → verbatim vía `normalizarErrorAccion` (reusar
      `cotizaciones-error-handler.ts`, no duplicar lógica).
      Soporta: spec `aprobaciones` — "Aprobar una solicitud", "Rechazar una solicitud",
      "Observar una solicitud", "Conflicto de concurrencia al resolver (409)"; design: diagrama
      de secuencia "resolver → invalidar → refetch".
- [x] 8.3 En `src/modulos/comercial/cotizaciones/servicios/cotizaciones-queries.ts`, en
      `useSolicitarAprobacionMutation` (renombrado en 5.2), agregar al `onSuccess`
      `invalidarConsulta(CLAVE_APROBACIONES_PENDIENTES)` y
      `invalidarConsulta(CLAVE_COTIZACION_APROBACIONES_HISTORIAL)` junto a las 3 claves ya
      invalidadas: la solicitud nueva agrega una fila a la bandeja **y** una entrada al historial
      del detalle. Importar ambas claves desde `../../claves-consulta`.
      Soporta: design — sección "Estrategia de invalidación (CRÍTICO)".
      **Depende de 6.1** (las claves deben existir) y **de 5.2** (el hook renombrado).

## 9. Slice `aprobaciones` — componentes UI

- [x] 9.1 Crear `src/modulos/comercial/aprobaciones/componentes/solicitud-estado-badge.tsx`:
      `Badge` con `variant` por `EstadoSolicitud` (`EN_APROBACION` → `"outline"`, `APROBADA` →
      `"default"`, `RECHAZADA` → `"destructive"`, `OBSERVADA` → `"secondary"`), clonando el
      patrón de `estado-cotizacion-badge.tsx`.
      Soporta: spec `aprobaciones` — "Historial de solicitudes de una cotización" (badge de
      estado); design: tabla "Componentes UI (shadcn)".
- [x] 9.2 Crear `src/modulos/comercial/aprobaciones/componentes/dialogo-resolver-solicitud.tsx`:
      diálogo controlado (`abierto`/`onOpenChange`, patrón de `dialogo-condiciones-version.tsx`),
      que recibe `idSolicitud: string` como prop (desde la bandeja es `fila.id`; desde el detalle
      es `solicitudVigente.id`, ver D6) y está
      parametrizado por prop `accion: "aprobar" | "rechazar" | "observar"` que selecciona schema
      (`schemaAprobar`/`schemaRechazar`/`schemaObservar`), label del título/botón, si el
      textarea es opcional u obligatorio, y el hook de mutación
      (`useAprobarMutation`/`useRechazarMutation`/`useObservarMutation`). `DialogTitle` siempre
      presente (con el label según `accion`). En el catch: 409 → mensaje inline específico +
      refetch de la bandeja (ya cubierto por `invalidarTrasResolver`); 422 → verbatim vía
      `normalizarErrorAccion`.
      Soporta: spec `aprobaciones` — "Aprobar una solicitud", "Rechazar una solicitud",
      "Observar una solicitud", "Conflicto de concurrencia al resolver (409)"; design D3 (mismo
      componente reusado desde bandeja y detalle) y bloque "Manejo de errores".
- [x] 9.3 Crear `src/modulos/comercial/aprobaciones/componentes/aprobaciones-bandeja-tabla.tsx`:
      `TablaDatos<ItemBandejaAprobacion>` con columnas `nº/año` (o "Sin numerar" cuando
      `numeroCotizacion`/`anioCotizacion` sean `null`), `numeroVersion`, `nombreEjecutivoResponsable`,
      `fechaCreacion`, `validezDias`; `AccionTabla` "Ver" con `href` a
      `/comercial/cotizaciones/:idCotizacion` y acciones aprobar/rechazar/observar que abren
      `dialogo-resolver-solicitud`; paginación server-side (`paginacion: { pagina, porPagina,
      total, alCambiarPagina }`), clonando el patrón de `cotizaciones-tabla.tsx`.
      Soporta: spec `aprobaciones` — "Bandeja de solicitudes pendientes" (ambos escenarios,
      incluyendo "sin numerar") y "Navegar al detalle desde la bandeja".
- [x] 9.4 Crear `src/modulos/comercial/aprobaciones/componentes/historial-aprobaciones.tsx`:
      feed apilado (NO tabla — es para insertarse en el detalle de la cotización) que recibe
      `SolicitudAprobacion[]` ya cargado vía `useHistorialAprobacionesQuery(idCotizacion)`;
      renderiza cada solicitud **en el orden recibido, sin reordenar** (design D2), con
      `solicitud-estado-badge`, comentario/motivo, usuario/fecha de creación y resolución.
      Estados: loading → `Skeleton`; vacío (`length === 0`) → `Empty` (de
      `@/compartido/componentes/ui/empty`); error → `Alert` con `extraerMensajeError`.
      Soporta: spec `cotizaciones` — "Historial de aprobaciones en el detalle de la cotización"
      (ambos escenarios); spec `aprobaciones` — "Historial de solicitudes de una cotización"
      (ambos escenarios); design D2.

## 10. Slice `aprobaciones` — vista y ruta

- [x] 10.1 Crear `src/modulos/comercial/aprobaciones/vistas/aprobaciones-vista.tsx`: usa
      `PaginaListado` + `useAprobacionesPendientesQuery` + `aprobaciones-bandeja-tabla`,
      clonando el patrón de `cotizaciones-vista.tsx` (estados `isLoading`/`isError` con
      `Alert`/`Skeleton`).
      Soporta: spec `aprobaciones` — "Bandeja de solicitudes pendientes".
- [x] 10.2 Crear `src/app/(privado)/comercial/aprobaciones/page.tsx`: server component que
      parsea `pagina`/`porPagina` de `searchParams` (sin filtros de bucket/estado/origen — la
      bandeja no los necesita), renderiza `<SiteHeader>` (breadcrumb "Gestión Comercial" →
      "Aprobación de cotizaciones") + `<AprobacionesVista/>`, clonando
      `app/(privado)/comercial/cotizaciones/page.tsx` simplificado (sin `[id]`).
      Soporta: spec `aprobaciones` — "Ruta y navegación de la bandeja de aprobaciones",
      escenario "Acceso desde el sidebar".
- [x] 10.3 En `src/compartido/componentes/app-sidebar.tsx`, dentro del bloque "Gestion
      Comercial" (línea ~92-109, después de "Todas las cotizaciones" en línea 107), agregar
      `{ title: "Aprobación de cotizaciones", url: "/comercial/aprobaciones" }`. **No** reusar ni
      modificar el ítem existente "Aprobaciones" de viáticos (línea ~184, `href="#"`) — son
      features distintas.
      Soporta: spec `aprobaciones` — "Ruta y navegación de la bandeja de aprobaciones",
      escenario "Acceso desde el sidebar"; propuesta — riesgo "Colisión de nombres en el
      sidebar".

## 11. Integración cross-slice en el detalle de cotización

- [x] 11.1 En `src/modulos/comercial/cotizaciones/vistas/cotizacion-detalle-vista.tsx`, montar
      `<HistorialAprobaciones idCotizacion={cotizacion.id} />` (import cruzado `cotizaciones →
      aprobaciones`, aceptado por design — ya existe precedente `cotizaciones → tarifarios`)
      como card apilada en el layout de secciones (junto al notebook de versiones).
      Soporta: spec `cotizaciones` — "Historial de aprobaciones en el detalle de la cotización".
- [x] 11.2 En el mismo archivo, exponer las acciones aprobar/rechazar/observar sobre la solicitud
      vigente, reusando `dialogo-resolver-solicitud` (mismo componente que la bandeja — D3).

      **Obtención del `idSolicitud` (D6).** Los endpoints de resolución son
      `POST /aprobaciones/:idSolicitud/…`, pero el detalle solo conoce `cotizacion.id`. El
      `idSolicitud` se deriva del historial que esta misma pantalla ya carga en 11.1 — cero
      requests extra, cero cambios de backend:

      ```ts
      const solicitudVigente = historial?.find((s) => s.estado === "EN_APROBACION") ?? null;
      ```

      Reglas (no improvisar):
      - Renderizar las acciones **solo si** `cotizacion.estado === "PENDIENTE_APROBACION"`
        **y** `solicitudVigente !== null`.
      - Si el estado es `PENDIENTE_APROBACION` pero no hay solicitud vigente (historial cargando,
        o desincronización), **no** renderizar las acciones. No inventar un `id` ni disparar un
        request especulativo.
      - No validar ni desempatar: el invariante "a lo sumo una solicitud `EN_APROBACION` por
        cotización" lo garantiza el backend (quórum = 1 + update condicional). Tomar la primera
        coincidencia.

      MVP: acciones visibles para cualquier usuario, **sin gating de permisos client-side**
      (non-goal explícito de la propuesta).
      Soporta: spec `aprobaciones` — "Acciones de resolución también en el detalle de la
      cotización", escenario "Resolver desde el detalle de la cotización"; design D3 y D6.
      **Depende de 11.1** (el historial debe estar cargado en la vista), **de 9.2** (el diálogo) y
      **de 8.2** (hooks de mutación).

## 12. Verificación final (gate del proyecto: sin test runner)

- [ ] 12.1 Ejecutar `pnpm build` y `pnpm lint` sobre el estado final; corregir cualquier error de
      tipos (en particular, confirmar que no queda ningún `switch` sobre `EstadoCotizacion` o
      `EstadoSolicitud` sin cubrir) y cualquier warning de lint antes de considerar la fase
      apply cerrada. Este es el gate definido en `openspec/config.yaml` (`rules.verify`); no hay
      test runner configurado, así que reemplaza a la suite automatizada.
      Soporta: `openspec/config.yaml` — `rules.apply`, `rules.verify`.

---

## Work Units (commits convencionales, sin PRs — entrega directa a `desarrollo`)

Cada unidad es un commit independiente con `pnpm build` verde al terminar. Sin ramas
encadenadas: se commitea en este orden directo sobre `desarrollo`.

| # | Commit (Conventional Commits) | Tareas | Motivo de agrupación |
|---|-------------------------------|--------|----------------------|
| WU1 | `feat(cotizaciones): modelar estado PENDIENTE_APROBACION` | 1.1, 1.2, 1.3 | Enum + los dos switches exhaustivos que rompen el build deben viajar juntos — no hay estado intermedio verde posible entre ellos. |
| WU2 | `feat(cotizaciones): corregir pipeline y sumar KPI de pendientes de aprobación` | 2.1, 2.2, 4.1, 4.2 | Aditivo: bucket + campo del resumen + su consumo (pipeline fix + tarjeta KPI). Ninguna rompe el build por separado, pero forman una historia (el bug fix del pipeline y el KPI nuevo son la misma superficie de "cotización pendiente"). |
| WU3 | `feat(cotizaciones): renombrar enviar a solicitarAprobacion y adoptar contrato 201` | 5.1, 5.2, 5.3 | Cambio no aditivo (A1). Rename + tipo de retorno + copy deben viajar juntos: el rename rompe los 2 call-sites (build rojo hasta actualizarlos) y el copy no puede mentir ni un commit. |
| WU4 | `feat(comercial): agregar claves de invalidación del slice aprobaciones` | 6.1 | Prerequisito de WU6 y WU8.3 — un archivo, cero riesgo, aislado para que el diff de claves sea trivial de revisar. |
| WU5 | `feat(aprobaciones): tipos, schemas y servicios API del slice nuevo` | 3.1, 3.2, 7.1 | Capa de datos pura del slice nuevo, sin UI — verificable solo con `tsc`/build. |
| WU6 | `feat(aprobaciones): hooks de consulta/mutación e invalidación centralizada` | 8.1, 8.2, 8.3 | La invalidación cruzada (`invalidarTrasResolver`) y el ajuste de `useSolicitarAprobacionMutation` son una sola decisión de diseño (ver "Estrategia de invalidación") — separarlos deja una mutación sin invalidar correctamente. |
| WU7 | `feat(aprobaciones): componentes de UI (badge, diálogo, bandeja, historial)` | 9.1, 9.2, 9.3, 9.4 | Es el work unit más grande (~600 líneas) pero indivisible sin dejar componentes huérfanos: la bandeja y el historial dependen del badge y del diálogo compartido. |
| WU8 | `feat(aprobaciones): vista de bandeja, ruta y entrada de sidebar` | 10.1, 10.2, 10.3 | Cierra el slice nuevo como feature navegable de punta a punta. |
| WU9 | `feat(cotizaciones): integrar historial y resolución en el detalle` | 11.1, 11.2 | Última pieza de integración cruzada — depende de que WU7/WU8 ya existan. |
| WU10 | `chore: verificar build y lint del loop de aprobación` | 12.1 | Gate final, sin cambios de producto. |

## Notas

- **Nomenclatura resuelta (`enviar` → `solicitarAprobacion`)**: spec y design coinciden. La
  función se renombra a `solicitarAprobacion` y se queda en `cotizaciones-api.ts` (D1). La ruta
  HTTP `POST /cotizaciones/:id/enviar` **no cambia** — el rename es solo del lado del front.
  Motivo: todo este cambio existe porque la palabra "enviar" miente (no envía nada al cliente,
  abre una solicitud). Arreglar el copy de la UI y dejar `enviarCotizacion` en el código deja la
  mentira justo donde la lee el próximo desarrollador. Son 2 call-sites (tareas 5.2 y 5.3).
- **`ENVIADA` es un estado, no un email.** En este dominio, "enviada" significa que la cotización
  quedó oficializada (versión congelada + número asignado). El sistema **no** manda correos: la
  entrega física al cliente es el PDF (`use-imprimir-pdf.ts`), que descarga el ejecutivo. No
  agregar ninguna funcionalidad de email — está fuera de alcance y no existe contrato de backend.
- **El detalle no conoce el `idSolicitud`**: se deriva del historial (D6, tarea 11.2). No crear
  endpoints ni queries nuevas para esto.
- El frontend **nunca** calcula `pendientesAprobacion` ni reordena el historial de
  aprobaciones — ambas reglas están explícitas en las tareas 2.2/4.2 (KPI) y 9.4 (historial) y
  no requieren lógica adicional de cálculo u ordenamiento en ningún componente.
- Cero tareas de test automatizado: el proyecto no tiene test runner (`openspec/config.yaml`,
  `rules.tasks: tdd: false`). El gate de calidad es la tarea 12.1 (build + lint) más verify
  adversarial fuera de esta lista.

## Review Workload Forecast

- **Líneas cambiadas estimadas**: ~850 líneas (8 archivos nuevos del slice `aprobaciones` +
  ~10 archivos existentes retocados; el work unit más grande, WU7, concentra ~600 líneas en
  4 componentes nuevos).
- **Chained PRs recommended: No.** La estrategia de entrega para este cambio es commits
  directos a `desarrollo`, sin PRs ni ramas encadenadas (no hay flujo de revisión por PR que
  encadenar). La maquinaria de PRs encadenados de `work-unit-commits` no aplica aquí porque no
  existe un paso de PR en el que "encadenar" tenga efecto — cada Work Unit ya es un commit
  atómico y revertible por sí mismo dentro de `desarrollo`.
- **400-line budget risk: High** (en términos absolutos de tamaño de diff total, aunque no
  hay presupuesto de PR que administrar). Mitigación aplicada: los 10 Work Units de la tabla
  de arriba mantienen cada commit individual muy por debajo de 400 líneas (el más grande, WU7,
  ronda ~600 líneas — si se quiere bajar ese commit también de 400 líneas, puede partirse en
  9.1+9.2 por un lado y 9.3+9.4 por otro, ya que el diálogo y el badge no dependen de la tabla
  ni del historial).
- **Decision needed before apply: No.** El `delivery_strategy` ya está fijado por el usuario
  (commits directos a `desarrollo`, sin PRs); no hay decisión de split/PR pendiente. Las dos
  ambigüedades que quedaban (nombre de la función, origen del `idSolicitud`) están cerradas en
  design D1 y D6 y reflejadas en las tareas 5.1–5.3 y 11.2. **No queda nada librado al criterio
  de quien implemente.**
