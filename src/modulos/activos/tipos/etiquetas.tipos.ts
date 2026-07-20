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

export interface AsignarEtiquetaPayload {
  activoId: number;
  reemplazarEtiquetaActual?: boolean;
}

export interface FiltrosEtiquetas {
  estado?: EstadoEtiqueta;
  estadoRegistro?: boolean;
  activoId?: number;
}

export type MotivoSinVinculacion = "SIN_ASIGNAR" | "REEMPLAZADA";

export interface EtiquetaPublicaActivo {
  codigo: string;
  descripcion: string;
  tipoActivo: string;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  anioFabricacion: number | null;
  clase: string | null;
  carroceria: string | null;
  categoria: string | null;
  ejes: number | null;
  cantidadRuedas: number | null;
  serieChasis: string | null;
  serieMotor: string | null;
  zonaRegistral: string | null;
  ubicacion: string | null;
  estadoActivo: string;
  estadoOperativo: string | null;
}

export interface EtiquetaConsultaPublica {
  vinculado: boolean;
  motivo?: MotivoSinVinculacion;
  etiquetaCodigo: string;
  activo?: EtiquetaPublicaActivo;
}
