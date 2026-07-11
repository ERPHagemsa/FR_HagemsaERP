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

// ── Plantillas ─────────────────────────────────────────────────────────────────

export type Plantilla = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estadoRegistro: EstadoRegistroChecklist;
};

export type FiltrosPlantillas = {
  estadoRegistro?: EstadoRegistroChecklist;
  pagina?: number;
  limite?: number;
};

export type CrearPlantillaPayload = {
  nombre: string;
  descripcion?: string;
};

export type EditarPlantillaPayload = {
  nombre: string;
  descripcion?: string;
};

export type TipoRespuestaItem = "CONFORMIDAD" | "MEDICION" | "SELECCION" | "TEXTO" | "BOOLEANO";

export type AmbitoSeccion = "PRINCIPAL" | "ACOPLE";

// Metadata de presentación del formulario impreso (JSON suelto, persistido tal
// cual el backend lo guarde — ver presentacion-impresion.ts en BC04_Flota).
// `formulario` es la clave que dispara el modo "plantilla fiel" (impresión
// pixel-perfect, estructura de ítems inmutable) cuando tiene valor.
export type PresentacionVersion = {
  titulo?: string | null;
  layoutNeumaticos?: "PAREADO" | "INDIVIDUAL";
  imagenes?: {
    etiqueta: string;
    archivo: string;
    grupoNeumatico?: string;
    seccion?: string;
  }[];
  firmas?: {
    inspectorRol: string;
    operadorRoles: string[];
  };
  formulario?: string | null;
} | null;

// ── Ítems / secciones tal como los devuelve el GET (ItemResponseDto/SeccionResponseDto) ──

export type ItemVersion = {
  id: string;
  etiqueta: string;
  etiquetaImpresa: string | null;
  tipoRespuesta: TipoRespuestaItem;
  requerido: boolean;
  capturaCantidad: boolean;
  unidad: string | null;
  rangoMin: number | null;
  rangoMax: number | null;
  opciones: string[] | null;
  orden: number;
};

export type SeccionVersion = {
  id: string;
  nombre: string;
  orden: number;
  ambito: AmbitoSeccion;
  items: ItemVersion[];
};

export type PlantillaVersion = {
  id: string;
  plantillaId: string;
  numeroVersion: number;
  publicada: boolean;
  criterioAplicabilidad: unknown;
  setNeumaticosDefault: unknown;
  presentacion: PresentacionVersion;
  publicadaEn: string | null;
  estadoRegistro: EstadoRegistroChecklist;
  secciones: SeccionVersion[];
};

export type FiltrosVersionesPlantilla = {
  pagina?: number;
  limite?: number;
};

// ── Ítems / secciones en el FORM (ItemDto/SeccionDto de entrada) ─────────────────
// `clientId` es local al front (uuid de React), nunca viaja al backend: el `id`
// del servidor cambia en cada PATCH .../estructura (reemplazo total), así que no
// sirve como key estable de lista entre renders/guardados sucesivos.

export type ItemFormInput = {
  clientId: string;
  etiqueta: string;
  etiquetaImpresa: string | null;
  tipoRespuesta: TipoRespuestaItem;
  requerido: boolean;
  capturaCantidad: boolean;
  unidad: string | null;
  rangoMin: number | null;
  rangoMax: number | null;
  opciones: string[] | null;
};

export type SeccionFormInput = {
  clientId: string;
  nombre: string;
  ambito: AmbitoSeccion;
  items: ItemFormInput[];
};

export type ItemDto = {
  etiqueta: string;
  etiquetaImpresa?: string | null;
  tipoRespuesta: string;
  requerido?: boolean;
  capturaCantidad?: boolean;
  unidad?: string | null;
  rangoMin?: number | null;
  rangoMax?: number | null;
  opciones?: string[] | null;
  orden?: number;
};

export type SeccionDto = {
  nombre: string;
  orden?: number;
  ambito?: AmbitoSeccion;
  items: ItemDto[];
};

export type CrearVersionPayload = {
  criterioAplicabilidad?: unknown;
  setNeumaticosDefault?: unknown;
  presentacion?: unknown;
  secciones: SeccionDto[];
};

export type RedefinirEstructuraPayload = {
  secciones: SeccionDto[];
};
