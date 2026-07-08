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
  // Correcciones ya enviadas tras la creación en BC-14 (la creación no cuenta).
  // Tope 3: el frontend bloquea el botón "Corregir" al llegar al máximo.
  intentosActualizacion: number;
  fechaCreacion: string;
  fechaModificacion: string | null;
}

// Máximo de correcciones que admite una ubicación ya sincronizada (debe coincidir
// con MAX_CORRECCIONES del backend). La creación es el "intento 0" y no cuenta.
export const MAX_CORRECCIONES_UBICACION = 3;

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
  idUbicacionBc14: number; // entero autoincremental que asigna BC-14
  fechaCreacion: string;
}

// Datos geográficos que emite el selector de mapa (Google Places / Geocoding)
// al elegir un lugar o mover el pin. Se vuelca sobre el formulario de completar.
export interface DatosUbicacionGeo {
  // Nombre sugerido del lugar (solo al elegir en el autocomplete; en drag no aplica).
  nombre?: string;
  pais: string;
  departamento: string;
  codigoDepartamento?: string;
  provincia: string;
  codigoProvincia?: string;
  distrito: string;
  codigoDistrito?: string;
  ubigeo?: string;
  direccion: string;
  latitud: number;
  longitud: number;
}

// Payload para completar una ubicación temporal. La dedup contra BC-14 la
// resuelve la fase final (PUB/SUB): al completar, la temporal queda COMPLETA y
// BC-14 valida y devuelve los datos para replicar en la maestra local.
export interface PayloadCompletarUbicacion {
  tipoUbicacion: TipoUbicacion;
  pais: string;
  departamento: string;
  codigoDepartamento?: string | null;
  provincia: string;
  codigoProvincia?: string | null;
  distrito: string;
  codigoDistrito?: string | null;
  ubigeo?: string | null;
  direccion: string;
  referenciaUbicacion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  coordenadasGoogle?: string | null;
}
