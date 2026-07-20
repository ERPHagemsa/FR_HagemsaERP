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
 * Filtros de tendencia: AHORA sigue el filtro global de periodo (`desde`/`hasta`)
 * como el resto de los widgets, mas ejecutivo. El backend decide la granularidad
 * (dia vs mes) segun el largo del rango y corta en hoy — el front no manda
 * `granularidad`, la recibe en la respuesta.
 */
export type FiltrosDashboardTendencia = RangoPeriodo & {
  idEjecutivoResponsable?: string;
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

/** Granularidad que el backend eligió para la serie de tendencia (segun el largo del rango). */
export type GranularidadTendencia = "dia" | "mes";

/**
 * Punto de la serie de tendencia. `fecha` es el inicio del bucket en ISO date
 * (`yyyy-MM-dd`): el día mismo si `granularidad='dia'`, o el 1° del mes si
 * `'mes'`. Se formatea en el front partiendo el string (sin `new Date`, para
 * NO caer en el corrimiento de timezone).
 */
export type PuntoTendencia = {
  fecha: string;
  ganadas: number;
  perdidas: number;
};

/**
 * espejo de TendenciaResultado, BC03 dashboard.repository.ts.
 * GET /dashboard/tendencia-mensual devuelve un OBJETO (ya no un array pelado):
 * CONTEO de cotizaciones ganadas vs. perdidas a lo largo del período elegido —
 * ya NO montos por moneda (la plata vive en los KPIs y en el ranking). El
 * backend decide `granularidad` por el largo del rango (corto → `dia`, largo →
 * `mes`) y corta en hoy. La serie es continua: los buckets sin cierres llegan
 * en `0`, no se omiten.
 */
export type TendenciaRespuesta = {
  granularidad: GranularidadTendencia;
  puntos: PuntoTendencia[];
};

/**
 * espejo de RankingEjecutivoResultado, BC03 obtener-ranking-ejecutivos.use-case.ts
 * (extiende DineroPorEjecutivo, dashboard.repository.ts:60-77).
 * GET /dashboard/ranking-ejecutivos devuelve `RankingEjecutivoRespuesta[]` PELADO.
 *
 * Contrato corregido (BC03 `2bbb181`): el contrato anterior tenia un bug —
 * `cantidadCreadas` (ancla UNICA a fecha de creacion) podia ser `0` mientras
 * `ganado`/`utilidad` (ancla a fecha de CIERRE) traian plata, si la
 * cotizacion se creo en un periodo y se cerro en otro. Eso mostraba filas
 * con dinero y "Sin datos" a la vez. `cantidadCerradas` y `cantidadCreadas`
 * YA NO EXISTEN.
 *
 * `cantidadDelPeriodo` reemplaza a `cantidadCreadas`: es el OR de 3 anclas
 * (creada, enviada o cerrada dentro del rango), y es el DENOMINADOR de
 * "Cotizados / Total". Por construccion, si `ganado.pen > 0` o
 * `ganado.usd > 0`, `cantidadDelPeriodo > 0` siempre — ya no puede
 * reproducirse el caso plata-con-denominador-cero.
 *
 * `cantidadGanadasDelPeriodo` comparte el MISMO cohorte que
 * `cantidadDelPeriodo` pero su DENOMINADOR en el front es
 * `cantidadEnviadas`, no `cantidadDelPeriodo` (cambio
 * `dashboard-kpis-motivos-respuesta-front`: la columna "Ganadas / Enviadas"
 * lee la tabla como un embudo, donde cada paso divide sobre el numerador del
 * paso anterior). NO confundir con `cantidadGanadas`, que sigue anclada a
 * fecha de CIERRE (alimenta el win rate clasico,
 * `cantidadGanadas / (cantidadGanadas + cantidadPerdidas)`, ya calculado por
 * el backend en el campo `winRate`) — ese es un cohorte y una condicion de
 * "sin datos" distintos de los de esta fila.
 *
 * `cantidadPerdidas` esta anclada a CIERRE, igual que `cantidadGanadas`:
 * juntas arman el denominador clasico de `winRate`, no el de las dos razones
 * de esta fila.
 *
 * `cantidadEnviadas` esta sobre el conjunto de `cantidadDelPeriodo` (ya no
 * sobre el viejo `cantidadCreadas`) y es el NUMERADOR de "Cotizados / Total"
 * a la vez que el DENOMINADOR de "Ganadas / Enviadas".
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
  /** Ancla CIERRE. Junto con `cantidadPerdidas` arma el denominador del `winRate` clasico. */
  cantidadGanadas: number;
  /** Ancla CIERRE. Solo alimenta `winRate` — no es el denominador de las dos razones de esta fila. */
  cantidadPerdidas: number;
  /** `null` sin cierres del ejecutivo en el periodo (mismo patron que WinRateRespuesta). */
  winRate: number | null;
  /**
   * Cotizaciones con actividad en el periodo: creadas, enviadas o cerradas
   * dentro de el (OR de 3 anclas). DENOMINADOR de "Cotizados / Total".
   */
  cantidadDelPeriodo: number;
  /**
   * Mismo cohorte que `cantidadDelPeriodo`. Numerador de "Cotizados / Total"
   * Y DENOMINADOR de "Ganadas / Enviadas".
   */
  cantidadEnviadas: number;
  /**
   * Mismo cohorte que `cantidadDelPeriodo`, filtrado a GANADA. Numerador de
   * "Ganadas / Enviadas" (el denominador de esa columna es `cantidadEnviadas`,
   * no `cantidadDelPeriodo`).
   */
  cantidadGanadasDelPeriodo: number;
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
