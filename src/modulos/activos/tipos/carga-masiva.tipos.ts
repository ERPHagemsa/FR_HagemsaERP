import type { CrearActivoPayload } from "./activo.tipos";

export type EstadoCargaMasiva =
  | "BORRADOR"
  | "VALIDADA"
  | "PROCESADA"
  | "PROCESADA_CON_ERRORES"
  | "ANULADA";

export type EstadoDetalleCargaMasiva =
  | "VALIDO"
  | "ADVERTENCIA"
  | "RECHAZADO"
  | "CREADO";

/** Una fila del Excel ya parseada y mapeada al payload de creacion. */
export type FilaCargaMasiva = {
  fila: number;
  activo: CrearActivoPayload;
};

export type CargaMasivaPayload = {
  tipoActivoReferenciaId: number;
  nombreArchivo?: string;
  observacion?: string;
  filas: FilaCargaMasiva[];
};

export type CargaMasivaDetalle = {
  id: number;
  fila: number;
  estado: EstadoDetalleCargaMasiva;
  codigoActivo: string | null;
  activoId: number | null;
  mensajeError: string | null;
};

export type CargaMasiva = {
  id: number;
  codigo: string;
  tipoActivoReferenciaId: number;
  nombreArchivo: string | null;
  estado: EstadoCargaMasiva;
  totalLeidos: number;
  totalCreados: number;
  totalRechazados: number;
  observacion: string | null;
  usuario: string | null;
  createdAt: string;
  detalles?: CargaMasivaDetalle[];
};

/**
 * Resultado de validar localmente una fila del Excel antes de enviarla.
 * `errores` mapea nombre de columna -> mensaje, para pintar la celda en rojo.
 */
export type FilaPrevisualizada = {
  fila: number;
  activo: CrearActivoPayload;
  valoresCrudos: Record<string, string>;
  errores: Record<string, string>;
  esValida: boolean;
};

// ---- Carga masiva de documentos ----

export type TipoDocumentoCarga =
  | "SOAT"
  | "POLIZA"
  | "TARJETA_PROPIEDAD"
  | "REVISION_TECNICA"
  | "FACTURA"
  | "CERTIFICADO"
  | "MANUAL"
  | "OTRO";

export type EstadoArchivoMasivo = "ASOCIADO" | "SIN_ACTIVO" | "ERROR";

export type AlcanceDocumento = "INDIVIDUAL" | "COMPARTIDO";

/** Una fila del Maestro Documentario (catalogo de tipos de documento). */
export type TipoDocumentoMaestro = {
  id: number;
  codigo: string;
  nombre: string;
  alcance: AlcanceDocumento;
  requiereVencimiento: boolean;
  orden: number;
  activo: boolean;
};

/** Un archivo listo para enviar, ya emparejado por placa/codigo. */
export type ArchivoDocumentoMasivo = {
  nombreArchivo: string;
  identificador: string;
  /** Para tipos COMPARTIDO: las placas/codigos que cubre el documento. */
  identificadores?: string[];
  tipoDocumento: TipoDocumentoCarga;
  numero?: string;
  fechaEmision?: string;
  fechaVencimiento?: string;
  contenidoBase64?: string;
};

export type CargaMasivaDocumentosPayload = {
  usuario?: string;
  archivos: ArchivoDocumentoMasivo[];
};

export type DetalleDocumentoMasivo = {
  nombreArchivo: string;
  identificador: string;
  estado: EstadoArchivoMasivo;
  codigoActivo: string | null;
  documentoId: number | null;
  mensajeError: string | null;
};

export type CargaMasivaDocumentosResultado = {
  totalArchivos: number;
  totalAsociados: number;
  totalSinActivo: number;
  detalles: DetalleDocumentoMasivo[];
};
