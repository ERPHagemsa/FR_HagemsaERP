export type EstadoRegistroChecklist = "ACTIVO" | "ANULADO";

export type Paginacion = {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
  tieneSiguiente: boolean;
  tieneAnterior: boolean;
};

export type RespuestaPaginada<T> = {
  datos: T[];
  paginacion: Paginacion;
};

// ── Tipos de checklist (HU-04-005) ────────────────────────────────────────────

export type TipoChecklist = {
  id: string;
  nombre: string;
  operadoresRequeridos: number;
  // Clases de vehículo a las que aplica (p.ej. ["Camión","Remolcador"]).
  // null/vacío = comodín, se ofrece para cualquier clase.
  clases: string[] | null;
  estadoRegistro: EstadoRegistroChecklist;
};

export type FiltrosTiposChecklist = {
  estadoRegistro?: EstadoRegistroChecklist;
  pagina?: number;
  limite?: number;
  // Filtra a los tipos con al menos una plantilla publicada aplicable a esta
  // clase de vehículo (Camión, Equipo liviano, Remolcador, Semirremolque...).
  clase?: string;
};

export type CrearTipoChecklistPayload = {
  nombre: string;
  operadoresRequeridos?: number;
  clases?: string[] | null;
};

export type EditarTipoChecklistPayload = {
  nombre: string;
  operadoresRequeridos?: number;
  clases?: string[] | null;
};

// ── Tipos de kit (HU-04-006) ──────────────────────────────────────────────────

export type TipoKitItem = {
  id: string;
  nombre: string;
  orden: number;
  estadoRegistro: EstadoRegistroChecklist;
};

export type TipoKit = {
  id: string;
  nombre: string;
  estadoRegistro: EstadoRegistroChecklist;
  items: TipoKitItem[];
};

export type FiltrosTiposKit = {
  estadoRegistro?: EstadoRegistroChecklist;
  pagina?: number;
  limite?: number;
};

export type ItemKitPayload = {
  nombre: string;
  orden?: number;
};

export type CrearTipoKitPayload = {
  nombre: string;
  items?: ItemKitPayload[];
};

export type EditarTipoKitPayload = {
  nombre: string;
  items?: ItemKitPayload[];
};

// ── Colores de rotulación (HU-04-007) ─────────────────────────────────────────

export type ColorRotulacion = {
  id: string;
  nombre: string;
  valorHex: string;
  estadoRegistro: EstadoRegistroChecklist;
};

export type FiltrosColoresRotulacion = {
  estadoRegistro?: EstadoRegistroChecklist;
  pagina?: number;
  limite?: number;
};

export type CrearColorRotulacionPayload = {
  nombre: string;
  valorHex: string;
};

export type EditarColorRotulacionPayload = {
  nombre: string;
  valorHex: string;
};
