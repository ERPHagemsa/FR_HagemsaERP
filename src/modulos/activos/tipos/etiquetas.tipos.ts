export type EstadoEtiqueta = "GENERADA" | "ASIGNADA" | "REEMPLAZADA" | "ANULADA";

export interface EtiquetaActivoResumen {
  id: number;
  codigo: string;
  descripcion: string;
}

export interface Etiqueta {
  id: number;
  codigo: string;
  token: string;
  contenidoQr: string;
  estado: EstadoEtiqueta;
  estadoRegistro: boolean;
  asignada: boolean;
  activoId: number | null;
  activo: EtiquetaActivoResumen | null;
  fechaAsignacion: string | null;
  usuarioAsignacion: string | null;
  observacion: string | null;
  usuarioCreacion: string | null;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface GenerarEtiquetasPayload {
  cantidad: number;
  observacion?: string;
}

export interface FiltrosEtiquetas {
  estado?: EstadoEtiqueta;
  estadoRegistro?: boolean;
  activoId?: number;
}
