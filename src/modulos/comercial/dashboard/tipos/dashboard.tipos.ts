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
