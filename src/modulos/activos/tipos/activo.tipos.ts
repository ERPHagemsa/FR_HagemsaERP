export type EstadoActivo = "ACTIVO" | "INACTIVO" | "SINIESTRADO" | "ELIMINADO";
export type TipoActivo =
  | "VEHICULO"
  | "EQUIPO"
  | "HERRAMIENTA"
  | "DISPOSITIVO"
  | "OTRO";
export type EstadoOperativo = "OPERATIVO" | "MANTENIMIENTO" | "NO_OPERATIVO";
export type EstadoCalibracion =
  | "CALIBRADA"
  | "NO_CALIBRADA"
  | "PENDIENTE"
  | "OBSERVADA";
export type ClaseEuro = "EURO_1" | "EURO_2" | "EURO_3" | "EURO_4" | "EURO_5";
export type TipoTransmision =
  | "AUTOMATICA"
  | "AUTOMATIZADA"
  | "MECANICA_10_VELOCIDADES"
  | "MECANICA_13_VELOCIDADES"
  | "MECANICA_15_VELOCIDADES"
  | "MECANICA_18_VELOCIDADES"
  | "MECANICA_OTRA";

export type VehiculoDetalle = {
  plantillaInventario: string;
  tarjetaPropiedad: string | null;
  tarjetaMercancias: string | null;
  soat: string | null;
  revisionTecnica12Meses: string | null;
  revisionTecnica6Meses: string | null;
  resolucionDirectoral: string | null;
  resolucionGerencial: string | null;
  iqbf: string | null;
  certificadoMatpel: string | null;
  certificadoBonificacion: string | null;
  certificadoOperatividad: string | null;
  placaRodaje: string | null;
  anioFabricacion: number | null;
  color: string | null;
  marca: string | null;
  modelo: string | null;
  carroceria: string | null;
  ejes: number | null;
  categoria: string | null;
  serieChasis: string | null;
  serieMotor: string | null;
  radioComunicacion: string | null;
  autorradio: string | null;
  llantasRepuesto: string | null;
  camara: string | null;
  tablet: string | null;
  dispositivosSeguridad: string | null;
  estadoOperativo: EstadoOperativo | null;
  cajaHerramientas: string | null;
  jaulaAntivuelco: string | null;
  carriboy: string | null;
  baranda: string | null;
  mamparon: string | null;
  ancho: number | null;
  longitud: number | null;
  alto: number | null;
  tipoSuspension: string | null;
  tipoTornamesa: string | null;
  capacidadTanqueGalones: number | null;
  estadoCalibracion: EstadoCalibracion | null;
  factorCorreccion: number | null;
  claseEuro: ClaseEuro | null;
  ratioCorona: number | null;
  tipoTransmision: TipoTransmision | null;
};

export type Activo = {
  id: number;
  codigo: string;
  tipoActivo: TipoActivo;
  descripcion: string;
  ubicacion: string;
  estadoActivo: EstadoActivo;
  observacion: string | null;
  vehiculo: VehiculoDetalle | null;
  createdAt: string;
  updatedAt: string;
};

export type CrearActivoPayload = {
  codigo: string;
  tipoActivo: TipoActivo;
  descripcion: string;
  ubicacion: string;
  estadoActivo: EstadoActivo;
  observacion?: string;
  vehiculo?: Partial<VehiculoDetalle> & {
    plantillaInventario: string;
  };
};

export type ActualizarActivoPayload = Omit<CrearActivoPayload, "codigo">;

export type TipoImagenActivo =
  | "FRONTAL"
  | "LATERAL"
  | "POSTERIOR"
  | "INTERIOR"
  | "DOCUMENTO"
  | "OTRO";

export type ImagenActivo = {
  id: number;
  activoId: number;
  tipoImagen: TipoImagenActivo;
  url: string;
  descripcion: string | null;
  orden: number;
  createdAt: string;
  updatedAt: string;
};

export type CrearImagenActivoPayload = {
  tipoImagen: TipoImagenActivo;
  url: string;
  descripcion?: string;
  orden?: number;
};

export type TipoDocumentoActivo =
  | "SOAT"
  | "POLIZA"
  | "TARJETA_PROPIEDAD"
  | "FACTURA"
  | "MANUAL"
  | "REVISION_TECNICA"
  | "CERTIFICADO"
  | "OTRO"
  | "TARJETA_MERCANCIAS"
  | "REVISION_TECNICA_12_MESES"
  | "REVISION_TECNICA_6_MESES"
  | "RESOLUCION_DIRECTORAL"
  | "RESOLUCION_GERENCIAL"
  | "IQBF"
  | "CERTIFICADO_MATPEL"
  | "CERTIFICADO_BONIFICACION"
  | "CERTIFICADO_OPERATIVIDAD";

export type EstadoDocumentoActivo =
  | "VIGENTE"
  | "POR_VENCER"
  | "VENCIDO"
  | "PENDIENTE"
  | "OBSERVADO"
  | "NO_APLICA";

export type DocumentoActivo = {
  id: number;
  activoId: number;
  tipoDocumento: TipoDocumentoActivo;
  estadoDocumento: EstadoDocumentoActivo;
  numero: string | null;
  fechaEmision: string | null;
  fechaVencimiento: string | null;
  archivoUrl: string | null;
  observacion: string | null;
  usuarioCarga: string | null;
  usuarioActualizacion: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CrearDocumentoActivoPayload = {
  tipoDocumento: TipoDocumentoActivo;
  numero: string;
  fechaEmision: string;
  fechaVencimiento?: string;
  archivoUrl: string;
  observacion?: string;
  usuarioCarga: string;
};

export type TipoTanqueActivo = "DIESEL" | "UREA";
export type UnidadMedidaTanque = "GALON" | "LITRO";

export type TanqueActivo = {
  id: number;
  activoId: number;
  tipoTanque: TipoTanqueActivo;
  capacidad: number;
  unidadMedida: UnidadMedidaTanque;
  orden: number;
  observacion: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CrearTanqueActivoPayload = {
  tipoTanque: TipoTanqueActivo;
  capacidad: number;
  orden?: number;
  observacion?: string;
};
