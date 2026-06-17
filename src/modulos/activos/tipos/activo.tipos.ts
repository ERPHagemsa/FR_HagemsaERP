export type EstadoActivo = "ACTIVO" | "INACTIVO" | "SINIESTRADO";
export type EstadoRegistro = boolean;
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
export type PlantillaInventario =
  | "CAMION"
  | "REMOLCADOR"
  | "SEMIREMOLQUE"
  | "EQUIPO_LIVIANO";

export type CarroceriaReferencia = {
  id: number;
  plantillaInventario: PlantillaInventario;
  nombre: string;
  descripcion: string | null;
  anchoSugerido: number | null;
  longitudSugerida: number | null;
  altoSugerido: number | null;
  ejesSugeridos: number | null;
  categoriaSugerida: string | null;
  activo: boolean;
};

export type VehiculoDetalle = {
  plantillaInventario: PlantillaInventario;
  carroceriaReferenciaId: number | null;
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
  placa: string | null;
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
  estadoRegistro?: EstadoRegistro;
  activoOrigenId: number | null;
  observacion: string | null;
  valorUnidad: number | null;
  moneda: string | null;
  proveedor: string | null;
  numeroFactura: string | null;
  fechaFactura: string | null;
  vehiculo: VehiculoDetalle | null;
  createdAt: string;
  updatedAt: string;
};

export type ActivoHistorial = {
  id: number;
  activoId: number;
  tipoCambio: string;
  campo: string | null;
  valorAnterior: string | null;
  valorNuevo: string | null;
  motivo: string | null;
  usuario: string | null;
  origenCambio: string | null;
  referenciaTipo: string | null;
  referenciaId: number | null;
  referenciaCodigo: string | null;
  createdAt: string;
};

export type TipoCambioConfiguracionHistorica =
  | "REPOTENCIACION"
  | "CAMBIO_CARROCERIA"
  | "CAMBIO_PLACA"
  | "REMOLCAMIENTO"
  | "MEJORA_ESTRUCTURAL"
  | "RENOVACION"
  | "OTRO";

export type ActivoConfiguracionHistorica = {
  id: number;
  activoNuevoId: number;
  activoAnteriorId: number | null;
  codigoAnterior: string | null;
  placaAnterior: string | null;
  carroceriaAnterior: string | null;
  codigoNuevo: string;
  placaNueva: string | null;
  carroceriaNueva: string | null;
  tipoCambio: TipoCambioConfiguracionHistorica;
  motivo: string | null;
  fechaCambio: string;
  documentoSustentoUrl: string | null;
  usuarioRegistro: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CrearConfiguracionHistoricaPayload = {
  codigoNuevo?: string;
  codigoAnterior?: string;
  placaAnterior?: string | null;
  carroceriaAnterior?: string | null;
  placaNueva?: string | null;
  carroceriaNueva?: string | null;
  tipoCambio: TipoCambioConfiguracionHistorica;
  motivo: string;
  fechaCambio?: string;
  documentoSustentoUrl?: string | null;
  usuarioRegistro?: string | null;
};

export type CrearActivoPayload = {
  codigo: string;
  tipoActivo: TipoActivo;
  descripcion: string;
  ubicacion: string;
  estadoActivo: EstadoActivo;
  observacion?: string;
  valorUnidad?: number | null;
  moneda?: string | null;
  proveedor?: string | null;
  numeroFactura?: string | null;
  fechaFactura?: string | null;
  vehiculo?: Partial<VehiculoDetalle> & {
    plantillaInventario: PlantillaInventario;
  };
};

export type OrigenCambioActivo =
  | "MAESTRO_ACTIVOS"
  | "INVENTARIO_FISICO"
  | "REPLAQUEO"
  | "CICLO_VIDA"
  | "DOCUMENTOS"
  | "SISTEMA";

export type ActualizarActivoPayload = Omit<CrearActivoPayload, "codigo"> & {
  origenCambio?: OrigenCambioActivo;
  referenciaTipo?: string;
  referenciaId?: number;
  referenciaCodigo?: string;
  motivoCambio?: string;
  usuarioCambio?: string;
};

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
  archivoUrl?: string;
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

export type EstadoInventarioFisico =
  | "CREADO"
  | "ABIERTO"
  | "EN_REVISION"
  | "CERRADO"
  | "ANULADO";

export type EstadoRevisionInventario =
  | "PENDIENTE"
  | "ENCONTRADO"
  | "FALTANTE"
  | "OBSERVADO"
  | "NO_APLICA";

export type InventarioFisicoDetalle = {
  id: number | null;
  inventarioId: number;
  activoId: number;
  estadoRevision: EstadoRevisionInventario;
  codigoActivo: string;
  descripcionActivo: string | null;
  tipoActivo: string | null;
  estadoActivo: string | null;
  marca: string | null;
  modelo: string | null;
  carroceria: string | null;
  estadoOperativo: string | null;
  estadoCalibracion: string | null;
  placa: string | null;
  ubicacionEsperada: string | null;
  ubicacionEncontrada: string | null;
  snapshotActivo: Record<string, unknown> | null;
  snapshotFecha: string | null;
  observacion: string | null;
  usuarioRevision: string | null;
  fechaRevision: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InventarioFisicoHistorial = {
  id: number;
  inventarioId: number;
  detalleId: number | null;
  activoId: number | null;
  accion: string;
  campo: string | null;
  valorAnterior: string | null;
  valorNuevo: string | null;
  motivo: string | null;
  usuario: string | null;
  referenciaTipo: string | null;
  referenciaId: number | null;
  referenciaCodigo: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type SnapshotHistoricoActivoInventario = {
  inventarioId: number;
  codigoInventario: string;
  nombreInventario: string;
  descripcionInventario: string | null;
  fechaApertura: string;
  fechaCierre: string | null;
  estadoInventario: EstadoInventarioFisico;
  detalleId: number;
  activoId: number;
  codigoActivo: string;
  estadoRevision: EstadoRevisionInventario;
  ubicacionEsperada: string | null;
  ubicacionEncontrada: string | null;
  observacion: string | null;
  snapshotActivo: Record<string, unknown> | null;
  snapshotFecha: string | null;
  fechaRevision: string | null;
};

export type PerfilFlotaTanque = {
  tipoTanque: TipoTanqueActivo;
  capacidad: number;
  unidadMedida: UnidadMedidaTanque;
};

export type PerfilFlota = {
  placa: string | null;
  clase: PlantillaInventario | null;
  modelo: string | null;
  carroceria: string | null;
  estadoOperativo: EstadoOperativo;
  ejes: number | null;
  categoria: string | null;
  combustible: PerfilFlotaTanque[];
};

export type PerfilCombustible = {
  id: number;
  codigo: string;
  placa: string | null;
  capacidadTanqueGalones: number | null;
  tanques: PerfilFlotaTanque[];
  estadoCalibracion: EstadoCalibracion;
  factorCorreccion: number | null;
  estadoActivo: EstadoActivo;
};

export type InventarioFisico = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  fechaApertura: string;
  fechaCierre: string | null;
  estado: EstadoInventarioFisico;
  usuarioApertura: string | null;
  usuarioCierre: string | null;
  observacion: string | null;
  createdAt: string;
  updatedAt: string;
  detalles: InventarioFisicoDetalle[];
  historial: InventarioFisicoHistorial[];
};

export type CrearInventarioFisicoPayload = {
  codigo: string;
  fechaApertura: string;
  descripcion: string;
  observacion?: string;
  usuarioApertura?: string;
};

export type ActualizarDetalleInventarioFisicoPayload = {
  estadoRevision: EstadoRevisionInventario;
  ubicacionEncontrada?: string;
  observacion?: string;
  usuarioRevision?: string;
};

export type RegistrarRevisionInventarioFisicoPayload =
  ActualizarDetalleInventarioFisicoPayload & {
    activoId: number;
  };

export type CerrarInventarioFisicoPayload = {
  usuarioCierre?: string;
  observacion?: string;
};
