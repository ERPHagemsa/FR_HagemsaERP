export type EstadoSolicitud = "EN_APROBACION" | "APROBADA" | "RECHAZADA" | "OBSERVADA";

export type SolicitudAprobacion = {
  id: string;
  idCotizacion: string;
  numeroVersion: number;
  estado: EstadoSolicitud;
  validezDias: number;
  comentario: string | null;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioResolucion: string | null;
  fechaResolucion: string | null;
};

export type ItemBandejaAprobacion = {
  id: string;
  idCotizacion: string;
  numeroVersion: number;
  validezDias: number;
  fechaCreacion: string;
  usuarioCreacion: string;
  numeroCotizacion: number | null;
  anioCotizacion: number | null;
  nombreEjecutivoResponsable: string;
};

export type RespuestaPaginadaAprobaciones = {
  data: ItemBandejaAprobacion[];
  total: number;
  pagina: number;
  porPagina: number;
};

export type PayloadAprobar = { comentario?: string };
export type PayloadRechazar = { motivo: string };
export type PayloadObservar = { comentario: string };
