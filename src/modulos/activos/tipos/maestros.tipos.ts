export type TipoCatalogoMaestro =
  | "TIPO_ACTIVO"
  | "CLASE_VEHICULO"
  | "CARROCERIA"
  | "CLASE_EURO"
  | "TIPO_TRANSMISION"
  | "ESTADO_CALIBRACION"
  | "TIPO_DOCUMENTO";

export type AccionHistorialCatalogo = "REGISTRO" | "MODIFICACION" | "ELIMINACION";

export interface ValorCatalogo {
  id: number;
  tipoCatalogo: TipoCatalogoMaestro;
  nombre: string;
  descripcion: string | null;
  estadoRegistro: boolean;
  claseVehiculoReferenciaId?: number | null;
  claseVehiculoReferenciaNombre?: string | null;
  /** Abreviatura de 1 letra (Clase) o 2 letras (Carroceria) para codigos futuros. */
  codigoAbreviado?: string | null;
  codigo?: string | null;
  alcance?: "INDIVIDUAL" | "COMPARTIDO" | null;
  requiereVencimiento?: boolean | null;
  orden?: number | null;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface ValorCatalogoHistorial {
  id: number;
  tipoCatalogo: TipoCatalogoMaestro;
  idRegistro: number;
  accion: AccionHistorialCatalogo;
  campo: string | null;
  valorAnterior: string | null;
  valorNuevo: string | null;
  motivo: string | null;
  usuario: string | null;
  fechaCreacion: string;
}

export interface CrearValorCatalogoPayload {
  nombre: string;
  descripcion?: string;
  claseVehiculoReferenciaId?: number;
  codigoAbreviado?: string;
  alcance?: "INDIVIDUAL" | "COMPARTIDO";
  requiereVencimiento?: boolean;
  orden?: number;
}

export interface ActualizarValorCatalogoPayload {
  nombre?: string;
  descripcion?: string;
  claseVehiculoReferenciaId?: number;
  codigoAbreviado?: string;
  alcance?: "INDIVIDUAL" | "COMPARTIDO";
  requiereVencimiento?: boolean;
  orden?: number;
}

export interface CambiarEstadoRegistroValorCatalogoPayload {
  estadoRegistro: boolean;
  motivo?: string;
  usuario?: string;
}

export interface FiltrosHistorialCatalogo {
  tipoCatalogo?: TipoCatalogoMaestro;
  idRegistro?: number;
  accion?: AccionHistorialCatalogo;
}
