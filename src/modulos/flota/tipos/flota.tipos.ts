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
  contrato?: string | null;
  cuenta?: string | null;
  estado?: string | null;
  estadoOperativo?: string | null;
  estadoCalibracion?: string | null;
  vehiculo?: {
    placaRodaje?: string | null;
    marca?: string | null;
    modelo?: string | null;
    carroceria?: string | null;
    estadoOperativo?: string | null;
    estadoCalibracion?: string | null;
  } | null;
};

export type ResumenFlota = {
  totalVehiculos?: number;
  operativosActivos?: number;
  mantenimiento?: number;
  noCalibrados?: number;
  bajasRecientes?: unknown[];
  registrosRecientes?: unknown[];
} | null;
