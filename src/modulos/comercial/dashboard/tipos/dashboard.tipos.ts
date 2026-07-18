// Tipos del modulo Comercial / Dashboard (BC-03).
//
// Fase 1 (aun vigente): tipos de PRESENTACION para los widgets del slice
// `dashboard` — filtro global de ejecutivo y el widget generico de lista
// accionable.
//
// Fase 2b (design D1/D2/D8): se LEVANTA el guardrail Fase 1 que prohibia
// identificadores `monto*`/`winRate*` — la agregacion ahora vive en BC03
// (8 endpoints `/dashboard/*`) y este archivo declara los tipos de RESPUESTA
// espejo EXACTO de esos DTOs, mas el estado del selector global de periodo.
// Los tipos que solo servian a los componentes de conteo de Fase 1
// (`DashboardKpisProps`, `DashboardListaEspecificaProps`) se retiraron junto
// con esos componentes (design D4/D11, tarea 4.2).

/**
 * Filtro global de ejecutivo (design D2): `undefined` representa "Todos". Se
 * eleva como estado en `DashboardVista` y baja por props a cada widget.
 */
export type IdEjecutivoFiltro = string | undefined;

/** Props del selector global de ejecutivo: valor controlado, sin estado propio. */
export type DashboardFiltroEjecutivoProps = {
  idEjecutivoResponsable: IdEjecutivoFiltro;
  alCambiar: (idEjecutivoResponsable: IdEjecutivoFiltro) => void;
};

/** Item generico de una lista accionable: id + etiqueta + enlace de detalle. */
export type DashboardItemAccionable = {
  id: string;
  titulo: string;
  subtitulo?: string;
  enlace: string;
};

/**
 * Props del widget presentacional generico de lista accionable (design D5):
 * base compartida por las listas "por aprobar", "sin cotizar" y "por vencer".
 */
export type DashboardListaAccionableProps = {
  titulo: string;
  items: DashboardItemAccionable[];
  isLoading: boolean;
  isError: boolean;
  mensajeError?: string;
  enlaceVerTodas?: string;
  ayuda?: string;
};

// ---------------------------------------------------------------------------
// Selector global de periodo (design D5/D6)
// ---------------------------------------------------------------------------

/**
 * Estado del selector global de periodo: `desde`/`hasta` en ISO date
 * (`yyyy-MM-dd`). Si el frontend no fija AMBOS extremos, el backend cae al
 * mes calendario actual (`RangoPeriodo.resolver`, BC03
 * rango-periodo.value-object.ts) — por eso ambos campos son opcionales y el
 * estado inicial puede ser `{}`.
 */
export type RangoPeriodo = {
  desde?: string;
  hasta?: string;
};

/**
 * Presets del selector global de periodo (`DashboardSelectorPeriodo`, tarea
 * 2.5). Cada preset resuelve a un `RangoPeriodo` en cliente; un rango custom
 * se expresa directamente como `RangoPeriodo` (sin preset asociado).
 */
export type PeriodoPreset =
  | "este-mes"
  | "mes-anterior"
  | "ultimos-3-meses"
  | "este-ano";

// ---------------------------------------------------------------------------
// Filtros de las 8 consultas del dashboard (D-restriccion verificada en design.md)
// ---------------------------------------------------------------------------

/**
 * Filtros de los endpoints "dependientes de periodo" que SI aceptan ejecutivo:
 * kpis-monetarios, win-rate, ciclo-cierre, motivos-perdida, embudo-conversion.
 */
export type FiltrosDashboardPeriodoEjecutivo = RangoPeriodo & {
  idEjecutivoResponsable?: string;
};

/**
 * Filtros de ranking-ejecutivos: SOLO periodo. El endpoint acepta
 * `idEjecutivoResponsable` en el DTO pero el use case lo ignora
 * (`obtener-ranking-ejecutivos.use-case.ts:25`) — el frontend deliberadamente
 * no expone ese campo aqui para no poder pasarlo por error (D-restriccion).
 */
export type FiltrosDashboardRanking = RangoPeriodo;

/**
 * Filtros de tendencia-mensual: SIN periodo (D6, la ventana es `meses` fijo
 * hacia atras, no `desde`/`hasta`), CON ejecutivo.
 */
export type FiltrosDashboardTendencia = {
  idEjecutivoResponsable?: string;
  meses?: number;
};

/** Filtros de acciones-pendientes: SOLO ejecutivo, sin periodo. */
export type FiltrosDashboardAcciones = {
  idEjecutivoResponsable?: string;
};

// ---------------------------------------------------------------------------
// Tipos de respuesta — espejo EXACTO de los DTOs de BC03 (design D2)
// ---------------------------------------------------------------------------

/** espejo de TotalPorMoneda, BC03 dashboard.repository.ts:5-8 — sin conversion ni suma cruzada. */
export type TotalPorMoneda = {
  pen: number;
  usd: number;
};

/** espejo de ResumenDineroPorEstado, BC03 dashboard.repository.ts:11-15 */
export type ResumenDineroPorEstado = {
  ganado: TotalPorMoneda;
  pipeline: TotalPorMoneda;
  ticketPromedio: TotalPorMoneda;
};

/**
 * espejo de KpisMonetariosResultado, BC03 obtener-kpis-monetarios.use-case.ts:9-19
 * GET /dashboard/kpis-monetarios.
 *
 * OJO (design D12): `variacionVsMesAnterior` aqui NO es un delta ya
 * calculado — son los KPIs crudos del periodo inmediatamente anterior de
 * igual duracion. El frontend deriva el delta comparando `actual` contra
 * este campo (ver `utilidades/delta-monetario.ts`).
 */
export type KpisMonetariosRespuesta = {
  actual: ResumenDineroPorEstado;
  variacionVsMesAnterior: ResumenDineroPorEstado;
};

/** espejo de WinRateResultado, BC03 calcular-win-rate.use-case.ts:6-24 — GET /dashboard/win-rate */
export type WinRateRespuesta = {
  ganadas: number;
  perdidas: number;
  /** `null` sin cierres GANADA/PERDIDA en el periodo — no confundir con `0`. */
  winRate: number | null;
  /** Puntos porcentuales (actual − anterior), ya calculado por backend. `null`-safe. */
  variacionVsMesAnterior: number | null;
};

/** espejo de CicloCierreResultado, BC03 calcular-ciclo-cierre.use-case.ts:6-19 — GET /dashboard/ciclo-cierre */
export type CicloCierreRespuesta = {
  /** `null` sin cierres GANADA en el periodo. */
  cicloPromedioDias: number | null;
  /**
   * Delta en dias (actual − anterior), CRUDO sin invertir signo (design D12):
   * el frontend colorea "menos es mejor" (negativo = mejora, positivo =
   * deterioro).
   */
  variacionVsMesAnterior: number | null;
};

/**
 * espejo de PuntoTendenciaMensual, BC03 dashboard.repository.ts:28-33
 * GET /dashboard/tendencia-mensual devuelve `PuntoTendenciaMensual[]` PELADO
 * (sin envelope). La ventana siempre trae un punto por mes (meses sin
 * cierres llegan en `0`, no se omiten).
 */
export type PuntoTendenciaMensual = {
  anio: number;
  mes: number;
  ganado: TotalPorMoneda;
  perdido: TotalPorMoneda;
};

/**
 * espejo de RankingEjecutivoResultado, BC03 obtener-ranking-ejecutivos.use-case.ts:9-15
 * (extiende DineroPorEjecutivo, dashboard.repository.ts:18-25).
 * GET /dashboard/ranking-ejecutivos devuelve `RankingEjecutivoRespuesta[]` PELADO.
 * `cantidadCerradas` = ganadas + perdidas del periodo (denominador de winRate);
 * `cantidadGanadas` = solo ganadas (Gap #3 de design.md).
 *
 * `cantidadCreadas`/`cantidadEnviadas` (commit BC03 `b8feebb`) estan
 * ancladas a la fecha de CREACION de la cotizacion — el mismo anclaje que
 * `ActividadPeriodo`, NO el de `cantidadCerradas`/`ganado`/`utilidad` (que
 * son fecha de CIERRE). Por eso "efectividad de cotizadas"
 * (`cantidadEnviadas / cantidadCreadas`) compara dentro del mismo cohorte,
 * pero "efectividad de cierre" (`cantidadGanadas / cantidadCreadas`) CRUZA
 * anclas y subestima a ejecutivos con actividad reciente (sus cotizaciones
 * nuevas todavia no tuvieron tiempo de cerrar) — advertencia obligatoria en
 * el copy de ayuda, no solo un comentario de tipos.
 *
 * `utilidad` puede ser NEGATIVA (cotizacion ganada bajo costo): no es un
 * error de datos, se muestra tal cual. El margen (`utilidad / ganado`) NO
 * viene del backend para este endpoint — se calcula en el FRONT como
 * fraccion 0..1, a diferencia de `margenPct` de `kpis-consolidado` (que
 * llega en escala 0..100): no pasar por el mismo `/100` aca.
 */
export type RankingEjecutivoRespuesta = {
  ejecutivoId: string;
  ejecutivoNombre: string;
  ganado: TotalPorMoneda;
  pipeline: TotalPorMoneda;
  cantidadGanadas: number;
  cantidadCerradas: number;
  /** `null` sin cierres del ejecutivo en el periodo (mismo patron que WinRateRespuesta). */
  winRate: number | null;
  /** Cantidad de cotizaciones creadas en el periodo (anclaje CREACION). */
  cantidadCreadas: number;
  /** Cantidad de cotizaciones enviadas en el periodo (anclaje CREACION). */
  cantidadEnviadas: number;
  /** Utilidad del periodo por moneda (anclaje CIERRE). Puede ser negativa. */
  utilidad: TotalPorMoneda;
};

/** espejo de MotivoPerdidaAgrupado, BC03 dashboard.repository.ts:41-47 */
export type MotivoPerdidaAgrupado = {
  /** Texto normalizado (trim + minusculas), usado como clave de agrupacion best-effort. */
  motivoNormalizado: string;
  /** Texto original tal como fue ingresado, para mostrar en UI. */
  motivoOriginal: string;
  cantidad: number;
};

/** espejo de MotivosPerdidaResultado, BC03 agrupar-motivos-perdida.use-case.ts:9-16 — GET /dashboard/motivos-perdida */
export type MotivosPerdidaRespuesta = {
  motivos: MotivoPerdidaAgrupado[];
};

/**
 * espejo de EmbudoConversion, BC03 dashboard.repository.ts:54-59
 * GET /dashboard/embudo-conversion. Semantica "ever-reached": contadores
 * monotonamente decrecientes (`solicitud >= cotizada >= enviada >= ganada`).
 */
export type EmbudoConversionRespuesta = {
  solicitud: number;
  cotizada: number;
  enviada: number;
  ganada: number;
};

/**
 * espejo de AccionPendienteConMonto, BC03 dashboard.repository.ts:61-70.
 * `moneda` refleja el enum `Moneda` de BC03 (`PEN` | `USD`), `null` cuando la
 * accion no tiene monto asociado (ej. solicitud sin cotizar).
 */
export type AccionPendiente = {
  id: string;
  referencia: string;
  /** `null` para solicitudes sin cotizar: aun no tienen ejecutivo asignado. */
  idEjecutivoResponsable: string | null;
  nombreEjecutivoResponsable: string | null;
  moneda: "PEN" | "USD" | null;
  monto: number | null;
};

/** espejo de AccionesPendientes, BC03 dashboard.repository.ts:72-76 — GET /dashboard/acciones-pendientes */
export type AccionesPendientesRespuesta = {
  porVencer72h: AccionPendiente[];
  esperandoAprobacion: AccionPendiente[];
  solicitudesSinCotizar: AccionPendiente[];
};

// ---------------------------------------------------------------------------
// kpis-consolidado / motivos-respuesta-cliente (endpoints BC03 posteriores a
// Fase 2b, cambio dashboard-kpis-motivos-respuesta-front)
// ---------------------------------------------------------------------------

/**
 * espejo de PorcentajePorMoneda, BC03 obtener-kpis-consolidados.use-case.ts.
 * OJO — a diferencia de `WinRateRespuesta.winRate` (fraccion 0..1), este
 * valor llega YA multiplicado por 100: `20` significa `20%`, no `2000%`.
 * Verificado contra el use case (`margen()`: `(utilidad / montoGanado) * 100`)
 * y el e2e (`margenPct.pen` ~= 20 para un margen del 20%). NO pasar directo a
 * `formatearPorcentaje` (que asume fraccion 0..1) sin dividir entre 100
 * primero, con una variable nombrada que deje explicito el porque.
 */
export type PorcentajePorMoneda = {
  pen: number;
  usd: number;
};

/**
 * espejo de ActividadPeriodo, BC03 obtener-kpis-consolidados.use-case.ts.
 * Cohorte anclada a la CREACION de la solicitud. Sin moneda: son conteos.
 *
 * `perdidas`: solicitudes con al menos una cotizacion en estado PERDIDA y
 * NINGUNA GANADA. VENCIDA y CANCELADA quedan FUERA a proposito (decision de
 * negocio): "perdida" significa que el CLIENTE la rechazo, no que la
 * cotizacion expiro o se cancelo internamente. Anclada a la misma fecha de
 * CREACION que el resto del bloque, igual que `totalSolicitudes`/`cotizadas`/`ganadas`.
 */
export type ActividadPeriodo = {
  totalSolicitudes: number;
  cotizadas: number;
  ganadas: number;
  perdidas: number;
};

/**
 * espejo de CerradoPeriodo, BC03 obtener-kpis-consolidados.use-case.ts.
 * Cohorte anclada a la FECHA DE CIERRE — DISTINTA de `ActividadPeriodo`:
 * jamas dividir un campo de una contra el de la otra.
 * `montoGanado`/`utilidad` son SOLO cotizaciones GANADAS del periodo, no
 * incluyen perdidas. `margenPct` NUNCA es `null` (es `0` cuando
 * `montoGanado` es `0`) — a diferencia de `WinRateRespuesta.winRate`. Para
 * distinguir "0% de margen con cierres reales" de "sin cierres" hay que
 * mirar `montoGanado`, no `margenPct`.
 */
export type CerradoPeriodo = {
  montoGanado: TotalPorMoneda;
  utilidad: TotalPorMoneda;
  margenPct: PorcentajePorMoneda;
};

/**
 * espejo de KpisConsolidadoResultado, BC03 obtener-kpis-consolidados.use-case.ts
 * GET /dashboard/kpis-consolidado.
 */
export type KpisConsolidadoRespuesta = {
  actividad: ActividadPeriodo;
  cerrado: CerradoPeriodo;
};

/** espejo del enum TipoMotivoRespuesta de BC03. */
export type TipoMotivoRespuesta = "RECHAZO" | "NEGOCIACION";

/**
 * espejo de MotivoRespuestaClienteAgrupado, BC03.
 * A diferencia de `MotivoPerdidaAgrupado` (texto libre del ejecutivo,
 * agrupacion best-effort) esto viene de un CATALOGO cerrado elegido por el
 * CLIENTE: `codigo` es estable, `etiqueta` es el texto a mostrar.
 */
export type MotivoRespuestaClienteAgrupado = {
  codigo: string;
  etiqueta: string;
  tipo: TipoMotivoRespuesta;
  cantidad: number;
};

/**
 * espejo de MotivosRespuestaClienteResultado — GET /dashboard/motivos-respuesta-cliente.
 * Lista PLANA ya ordenada por (tipo, cantidad DESC): el frontend particiona
 * por `tipo` preservando ese orden, no reordena.
 */
export type MotivosRespuestaClienteRespuesta = {
  motivos: MotivoRespuestaClienteAgrupado[];
};
