export type VehiculoFlota = {
  id: string;
  codigo?: string | null;
  descripcion?: string | null;
  tipoActivo?: string | null;
  estadoActivo?: string | null;
  ubicacion?: string | null;
  updatedAt?: string | null;
  placa?: string | null;
  placaRodaje?: string | null;
  marca?: string | null;
  modelo?: string | null;
  carroceria?: string | null;
  serieChasis?: string | null;
  serieMotor?: string | null;
  anioFabricacion?: number | null;
  color?: string | null;
  asignaciones?: {
    id?: number;
    contrato: unknown;
    cuenta: unknown;
    fechaInicio?: string | null;
    fechaFin?: string | null;
  }[];
  estadoRegistro?: string | null;
  estado?: string | null;
  estadoOperativo?: string | null;
  vehiculo?: {
    placaRodaje?: string | null;
    marca?: string | null;
    modelo?: string | null;
    carroceria?: string | null;
    estadoOperativo?: string | null;
    estadoCalibracion?: string | null;
  } | null;
};

export type ReferenciaFlota = {
  id: string;
  codigo: string;
  nombre: string;
};

export type ContratoDisponibleFlota = ReferenciaFlota & {
  cuenta: ReferenciaFlota | null;
};

export type ResumenFlota = {
  totalVehiculos?: number;
  operativosActivos?: number;
  mantenimiento?: number;
  bajasRecientes?: unknown[];
  registrosRecientes?: unknown[];
} | null;
