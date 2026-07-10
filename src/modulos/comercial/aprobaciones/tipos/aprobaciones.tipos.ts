/**
 * El porton es binario: al aprobador solo le cabe dejar salir la cotizacion
 * (`aprobar`) o no dejarla salir (`rechazar`, con motivo obligatorio). No hay
 * un tercer destino — para matar la cotizacion existe `cancelar`, que pertenece
 * al ciclo de vida de la cotizacion, no al de la aprobacion.
 */
export type EstadoSolicitud = "EN_APROBACION" | "APROBADA" | "RECHAZADA";

/**
 * Buckets de KPI de /aprobaciones/resumen. Son una particion exacta de las
 * solicitudes y mapean 1:1 con `EstadoSolicitud`: cada tarjeta filtra el
 * listado por su estado.
 */
export type BucketAprobacion = "enAprobacion" | "aprobadas" | "rechazadas";

export const ESTADO_POR_BUCKET: Record<BucketAprobacion, EstadoSolicitud> = {
  enAprobacion: "EN_APROBACION",
  aprobadas: "APROBADA",
  rechazadas: "RECHAZADA",
};

export const BUCKET_POR_ESTADO: Record<EstadoSolicitud, BucketAprobacion> = {
  EN_APROBACION: "enAprobacion",
  APROBADA: "aprobadas",
  RECHAZADA: "rechazadas",
};

/**
 * Los campos `usuario*` traen el `accountId` (identificador opaco del sistema
 * de auth). Los `nombreUsuario*` son snapshots del nombre al momento del hecho:
 * son los que se renderizan. Nunca mostrar un `accountId` en pantalla.
 */
export type SolicitudAprobacion = {
  id: string;
  idCotizacion: string;
  numeroVersion: number;
  estado: EstadoSolicitud;
  validezDias: number;
  comentario: string | null;
  usuarioCreacion: string;
  nombreUsuarioCreacion: string;
  fechaCreacion: string;
  usuarioResolucion: string | null;
  nombreUsuarioResolucion: string | null;
  fechaResolucion: string | null;
};

/** Item de GET /aprobaciones: la solicitud + datos de su cotizacion, sin join extra. */
export type ItemAprobacion = SolicitudAprobacion & {
  /**
   * Codigo ya formateado por el backend (mismo mapper que API-Cotizaciones).
   * Se arma con la version que se envio a aprobar (`numeroVersion`), NO con la
   * vigente: la fila describe ESE envio. `null` mientras la cotizacion no tenga
   * numero/anio, o si sede/ejecutivo son el centinela `XX` (usuario sin token).
   * No reconstruirlo en el front a partir de numero/anio.
   */
  codigoCotizacion: string | null;
  numeroCotizacion: number | null;
  anioCotizacion: number | null;
  nombreEjecutivoResponsable: string;
};

export type RespuestaPaginadaAprobaciones = {
  data: ItemAprobacion[];
  total: number;
  pagina: number;
  porPagina: number;
};

/** GET /aprobaciones/resumen. `total` es la suma de los 3 buckets. */
export type ResumenAprobaciones = {
  total: number;
  enAprobacion: number;
  aprobadas: number;
  rechazadas: number;
};

/** GET /aprobaciones/aprobadores: pobla el desplegable del filtro. */
export type Aprobador = {
  id: string;
  nombre: string;
};

export type FiltrosAprobaciones = {
  estado?: EstadoSolicitud;
  usuarioResolucion?: string;
  numeroCotizacion?: number;
  pagina?: number;
  porPagina?: number;
};

export type PayloadAprobar = { comentario?: string };
export type PayloadRechazar = { motivo: string };
