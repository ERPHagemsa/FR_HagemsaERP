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
  estadoRegistro: EstadoRegistroChecklist;
  iniciadaEn: string | null;
  completadaEn: string | null;
  cerradaEn: string | null;
  fechaCreacion: string;
};

// ── Detalle completo ──────────────────────────────────────────────────────────

export type Inspeccion = InspeccionResumen & {
  tipoChecklist: { id?: string; nombre?: string } | null;
  vehiculo: Record<string, unknown> | null;
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
