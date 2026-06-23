export type TipoCatalogoMaestro =
  | "TIPO_ACTIVO"
  | "CLASE_VEHICULO"
  | "CARROCERIA"
  | "CLASE_EURO"
  | "TIPO_TRANSMISION"
  | "ESTADO_CALIBRACION";

export type AccionHistorialCatalogo = "REGISTRO" | "MODIFICACION" | "ELIMINACION";

export interface ValorCatalogo {
  id: number;
  tipoCatalogo: TipoCatalogoMaestro;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  estadoRegistro: boolean;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
}

export interface CrearValorCatalogoPayload {
  nombre: string;
  descripcion?: string;
}

export interface ActualizarValorCatalogoPayload {
  nombre?: string;
  descripcion?: string;
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
