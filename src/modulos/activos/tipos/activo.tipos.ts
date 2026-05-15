export type EstadoActivo = "ACTIVO" | "INACTIVO" | "SINIESTRADO";
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
};

export type Activo = {
  id: string;
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
