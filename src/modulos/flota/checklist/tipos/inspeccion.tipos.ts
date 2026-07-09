import type { EstadoRegistroChecklist, Paginacion } from "./checklist.tipos";

// ── Enums de dominio (espejo del backend BC04_Flota / Prisma) ─────────────────

export type EstadoInspeccion = "BORRADOR" | "COMPLETA" | "CONFIRMADA";

export type EstadoItem =
  | "SIN_RESPONDER"
  | "CONFORME"
  | "NO_CONFORME"
  | "NO_APLICA";

export type TipoRespuesta =
  | "CONFORMIDAD"
  | "MEDICION"
  | "SELECCION"
  | "TEXTO"
  | "BOOLEANO";

// ── Estructura resuelta de la inspección (snapshot de la versión) ─────────────

export type InspeccionItem = {
  id: string;
  plantillaItemId: string | null;
  etiqueta: string;
  tipoRespuesta: TipoRespuesta;
  requerido: boolean;
  capturaCantidad: boolean;
  unidad: string | null;
  rangoMin: number | null;
  rangoMax: number | null;
  orden: number;
  estadoItem: EstadoItem;
  cantidad: number | null;
  valorNumerico: number | null;
  valorTexto: string | null;
  valorBooleano: boolean | null;
  observacion: string | null;
  respondidoEn: string | null;
};

export type InspeccionSeccion = {
  id: string;
  nombre: string;
  orden: number;
  items: InspeccionItem[];
};

export type InspeccionNeumatico = {
  id: string;
  grupo: string;
  posicion: string;
  orden: number;
  cocadaMm: number | null;
  otro: string | null;
  fecha: string | null;
  respondidoEn: string | null;
};

// ── Resumen (fila de listado) ─────────────────────────────────────────────────

export type InspeccionResumen = {
  id: string;
  codigo: number | null;
  estado: EstadoInspeccion;
  plantillaVersionId: string;
  unidadId: string;
  vehiculoPlaca: string | null;
  unidadAcopleId: string | null;
  vehiculoAcoplePlaca: string | null;
  estadoRegistro: EstadoRegistroChecklist;
  iniciadaEn: string | null;
  completadaEn: string | null;
  cerradaEn: string | null;
  fechaCreacion: string;
};

// ── Detalle completo ──────────────────────────────────────────────────────────

// Espejo de VehiculoSnapshot (backend BC04_Flota) — snapshot del vehículo al
// momento de iniciar la inspección, no una referencia viva a BC-Activos.
export type VehiculoSnapshot = {
  tipo: string | null;
  marca: string | null;
  modelo: string | null;
  carroceria: string | null;
  clase: string | null;
  descripcion: string | null;
};

export type Inspeccion = InspeccionResumen & {
  tipoChecklist: { id?: string; nombre?: string } | null;
  vehiculo: VehiculoSnapshot | null;
  vehiculoAcople: VehiculoSnapshot | null;
  contrato: Record<string, unknown> | null;
  cuenta: Record<string, unknown> | null;
  horometro: number | null;
  hubodometro: number | null;
  kilometraje: number | null;
  destino: string | null;
  colorRotulacionId: string | null;
  colorRotulacion: { id?: string; nombre?: string; valorHex?: string } | null;
  operadores: unknown | null;
  inspectorId: string | null;
  inspector: unknown | null;
  actorId: string;
  actor: unknown | null;
  observaciones: string | null;
  // Snapshot inmutable fijado al iniciar (ver criterioAplicabilidad.acido en
  // el backend) — no se deriva de la plantilla resuelta, así el PDF de una
  // inspección vieja no cambia si la plantilla se re-publica.
  acido: boolean;
  secciones: InspeccionSeccion[];
  neumaticos: InspeccionNeumatico[];
};

// ── Filtros y payloads ────────────────────────────────────────────────────────

export type FiltrosInspecciones = {
  unidadId?: string;
  estado?: EstadoInspeccion;
  estadoRegistro?: EstadoRegistroChecklist;
  pagina?: number;
  limite?: number;
};

export type RespuestaPaginadaInspecciones = {
  datos: InspeccionResumen[];
  paginacion: Paginacion;
};

export type IniciarInspeccionPayload = {
  tipoChecklistId: string;
  unidadId: string;
  // Unidad complementaria (remolcador <-> semirremolque). Obligatoria cuando
  // la unidad principal es de clase Remolcador o Semirremolque.
  unidadAcopleId?: string | null;
  // Modificador que el inspector marca explícitamente ("¿Transporta ácido/
  // material peligroso?"). Resuelve una PlantillaVersion distinta para la
  // misma clase. Default false (checklist normal).
  acido?: boolean;
  asignacionId?: number | null;
  horometro?: number | null;
  hubodometro?: number | null;
  kilometraje?: number | null;
  destino?: string | null;
  colorRotulacionId?: string | null;
  inspectorDocumento?: string | null;
  operadoresDocumentos?: string[] | null;
  observaciones?: string | null;
};

// ── Captura de respuestas (HU-04-010) ─────────────────────────────────────────

export type RespuestaItemPayload = {
  itemId: string;
  estadoItem?: EstadoItem;
  cantidad?: number | null;
  valorNumerico?: number | null;
  valorTexto?: string | null;
  valorBooleano?: boolean | null;
  observacion?: string | null;
};

export type LecturaNeumaticoPayload = {
  neumaticoId: string;
  cocadaMm?: number | null;
  otro?: string | null;
  fecha?: string | null;
};

export type RegistrarRespuestasPayload = {
  respuestas?: RespuestaItemPayload[];
  neumaticos?: LecturaNeumaticoPayload[];
};
