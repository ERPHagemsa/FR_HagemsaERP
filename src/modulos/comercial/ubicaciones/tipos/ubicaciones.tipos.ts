// Tipos del módulo de Ubicaciones (Comercial, Fase 1).
// BC-14 (Configuración General) es la fuente maestra; Comercial lleva el ciclo
// de edición en una tabla temporal por cotización y una maestra local que es
// réplica de lo confirmado por BC-14.

export type TipoUbicacion =
  | "SEDE"
  | "CLIENTE"
  | "PLANTA"
  | "MINA"
  | "PUERTO"
  | "PEAJE"
  | "ESTACIONAMIENTO"
  | "ALMACEN"
  | "PATIO"
  | "TERMINAL"
  | "OTRO";

// Ciclo de vida de la ubicación temporal (el estado vive en la temporal):
//   PENDIENTE    → nace al cotizar, solo con el nombre.
//   COMPLETA     → datos completos tras ganar; a la espera del PUB/SUB (fase final).
//   SINCRONIZADA → ya existe en la maestra local (dedup con match o confirmación BC-14).
export type EstadoUbicacionTemporal = "PENDIENTE" | "COMPLETA" | "SINCRONIZADA";

// Ubicación temporal tal como la devuelve el backend.
export interface UbicacionTemporal {
  id: string;
  idCotizacion: string;
  nombre: string;
  estado: EstadoUbicacionTemporal;
  tipoUbicacion: TipoUbicacion | null;
  pais: string | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  direccion: string | null;
  referenciaUbicacion: string | null;
  latitud: number | null;
  longitud: number | null;
  idUbicacion: string | null;
  fechaCreacion: string;
  fechaModificacion: string | null;
}

// Ubicación del maestro de BC-14 (candidata de dedup / réplica local).
export interface UbicacionBc14 {
  id: string;
  nombre: string;
  tipoUbicacion: TipoUbicacion;
  pais: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  referenciaUbicacion: string | null;
  latitud: number | null;
  longitud: number | null;
}

// Ubicación maestra local (réplica confirmada de BC-14).
export interface Ubicacion extends UbicacionBc14 {
  idUbicacionBc14: string;
  fechaCreacion: string;
}

// Datos geográficos que emite el selector de mapa (Google Places / Geocoding)
// al elegir un lugar o mover el pin. Se vuelca sobre el formulario de completar.
export interface DatosUbicacionGeo {
  // Nombre sugerido del lugar (solo al elegir en el autocomplete; en drag no aplica).
  nombre?: string;
  pais: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  latitud: number;
  longitud: number;
}

// Filtros del proxy de búsqueda/dedup contra BC-14.
export interface FiltroUbicacionesBc14 {
  nombre?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
}

// Payload para completar una ubicación temporal. La decisión de dedup es
// mutuamente excluyente: vincular una existente de BC-14 O confirmar que es nueva.
export interface PayloadCompletarUbicacion {
  tipoUbicacion: TipoUbicacion;
  pais: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  referenciaUbicacion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  coordenadasGoogle?: string | null;
  // Vincular a una ubicación existente de BC-14 (se copia a la maestra local).
  vincularUbicacionBc14Id?: string;
  // Confirmar que es una ubicación nueva (queda COMPLETA a la espera del PUB/SUB).
  confirmarCreacion?: boolean;
}
