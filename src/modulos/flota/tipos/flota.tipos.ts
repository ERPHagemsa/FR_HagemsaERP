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
  contrato?: unknown;
  cuenta?: unknown;
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
