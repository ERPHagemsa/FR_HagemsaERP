// Tipos del modulo Inspecciones de Activos (Epica E15, FT-AS-007).
// Espejo de los DTOs de `hagemsa-activos-service/src/inspecciones/application/dto`.

export type EstadoInspeccion = "ABIERTA" | "CERRADA" | "ANULADA";

export type InspeccionDetalleObservacion = {
  id: number;
  detalleId: number;
  orden: number;
  texto: string;
  fechaCreacion: string;
};

export type InspeccionImagen = {
  id: number;
  detalleId: number;
  url: string;
  nombreArchivo: string | null;
  descripcion: string | null;
  orden: number;
  fechaCreacion: string;
};

export type InspeccionDetalle = {
  id: number;
  inspeccionId: number;
  activoId: number;
  codigoActivo: string;
  placa: string | null;
  tipoActivo: string | null;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  serieChasis: string | null;
  snapshotFecha: string | null;
  datosOperativosFecha: string | null;
  fechaCreacion: string;
  fechaModificacion: string;
  observaciones: InspeccionDetalleObservacion[];
  imagenes: InspeccionImagen[];
};

export type InspeccionHistorial = {
  id: number;
  inspeccionId: number;
  detalleId: number | null;
  activoId: number | null;
  accion: string;
  motivo: string | null;
  usuario: string | null;
  metadata: unknown;
  fechaCreacion: string;
};

export type Inspeccion = {
  id: number;
  responsable: string;
  fechaInspeccion: string;
  descripcion: string | null;
  observacion: string | null;
  estado: EstadoInspeccion;
  usuarioApertura: string | null;
  usuarioCierre: string | null;
  fechaCierre: string | null;
  fechaCreacion: string;
  fechaModificacion: string;
  detalles: InspeccionDetalle[];
  historial: InspeccionHistorial[];
};

// Fila del listado de inspecciones: cabecera + total, sin detalles/historial.
export type InspeccionResumen = Omit<Inspeccion, "detalles" | "historial"> & {
  totalActivos: number;
};

// Fila del buscador de candidatos (boton "Registrar").
export type CandidatoInspeccion = {
  activoId: number;
  codigo: string;
  descripcion: string;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  tipoActivo: string | null;
  serieChasis: string | null;
  serieMotor: string | null;
};

// Snapshot congelado del vehiculo dentro de `snapshot_activo` (JSON).
export type SnapshotActivoInspeccion = {
  ubicacion?: string | null;
  tipoActivo?: string | null;
  vehiculo?: {
    marca?: string | null;
    modelo?: string | null;
    placa?: string | null;
    serieChasis?: string | null;
    color?: string | null;
  } | null;
} | null;

// Datos operativos del endpoint externo (propietario/estado/ubicacion/conductor/cuenta).
// Los 5 campos pueden venir null mientras DATOS_OPERATIVOS_API_URL no este configurada.
export type DatosOperativosInspeccion = {
  propietario?: string | null;
  ubicacion?: string | null;
  conductor?: string | null;
  cuenta?: string | null;
} | null;

// Snapshot de un detalle puntual, pedido bajo demanda al abrir la ficha "Inspeccionar".
export type SnapshotDetalleInspeccion = {
  detalleId: number;
  inspeccionId: number;
  activoId: number;
  codigoActivo: string;
  snapshotActivo: SnapshotActivoInspeccion;
  snapshotFecha: string | null;
  datosOperativos: DatosOperativosInspeccion;
  datosOperativosFecha: string | null;
};

export type CrearInspeccionPayload = {
  responsable: string;
  fechaInspeccion: string;
  descripcion?: string;
  observacion?: string;
  usuarioApertura?: string;
};

export type CandidatoInspeccionFiltro = {
  q?: string;
  etiqueta?: string;
};

export type RegistrarActivosInspeccionPayload = {
  activoIds: number[];
  usuario?: string;
};

export type ActualizarObservacionesDetallePayload = {
  observaciones: string[];
  usuario?: string;
};

// Edicion de datos operativos: el propietario NO se edita (viene del manifiesto).
export type ActualizarDatosOperativosDetallePayload = {
  ubicacion?: string | null;
  conductor?: string | null;
  cuenta?: string | null;
  usuario?: string;
};

export type CrearImagenInspeccionPayload = {
  url: string;
  nombreArchivo?: string;
  descripcion?: string;
  orden?: number;
  usuario?: string;
};

export type CerrarInspeccionPayload = {
  usuarioCierre?: string;
  observacion?: string;
};

export type FormatoExportacionInspeccion = "excel" | "pdf";
