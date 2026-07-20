// Tipos del modulo Comercial / Prospectos.
// Solo declaraciones de tipo — sin imports de runtime (zod va en prospecto.schemas.ts).

export type TipoDocumento = "RUC" | "DNI" | "CE";

export type MedioContactoInicial =
  | "CORREO"
  | "LLAMADA"
  | "PRESENCIAL"
  | "OTRO";

export type EstadoProspecto = "ACTIVO" | "CONVERTIDO" | "DESCARTADO";

// ---------------------------------------------------------------------------
// Entidades del dominio
// ---------------------------------------------------------------------------

export type Contacto = {
  id: string;
  nombre: string;
  cargo: string | null;
  telefono: string | null;
  email: string;
  observaciones: string | null;
  esPrincipal: boolean;
};

export type Prospecto = {
  id: string;
  // razonSocial es el nombre legal/formal (obligatorio); nombreComercial es el
  // nombre de fantasia (opcional) — ver contrato API-Prospectos §4.
  nombreComercial: string | null;
  razonSocial: string;
  direccion: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  medioContactoInicial: MedioContactoInicial;
  estado: EstadoProspecto;
  idEjecutivoResponsable: string;
  motivoDescarte: string | null;
  // Eje de existencia (soft-delete), ortogonal a `estado` (negocio). true = activo,
  // false = eliminado. El listado lo expone para tachar en sitio las filas eliminadas
  // cuando se pide con `incluirEliminados=true` (ver FiltrosProspectos).
  estadoRegistro: boolean;
  contactos: Contacto[];
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string | null;
};

// ---------------------------------------------------------------------------
// Paginacion propia (NO reutiliza RespuestaPaginada de compartido — forma distinta)
// ---------------------------------------------------------------------------

export type RespuestaPaginadaProspectos = {
  data: Prospecto[];
  total: number;
  pagina: number;
  porPagina: number;
};

// ---------------------------------------------------------------------------
// Historial / feed de auditoria (§5.3.1)
// ---------------------------------------------------------------------------

export type AccionHistorial = "REGISTRO" | "MODIFICACION" | "ELIMINACION";

export type EntradaHistorial = {
  prospectoId: string;
  prospectoNombre: string;
  accion: AccionHistorial;
  fechaAccion: string;
  usuarioAccion: string;
  // Snapshots: campos cambiados. null en REGISTRO (anteriores) / ELIMINACION (nuevos).
  datosAnteriores: Record<string, unknown> | null;
  datosNuevos: Record<string, unknown> | null;
};

export type FiltrosHistorial = {
  prospectoId?: string;
  accion?: AccionHistorial;
  desde?: string;
  hasta?: string;
  pagina?: number;
  porPagina?: number;
};

export type RespuestaPaginadaHistorial = {
  data: EntradaHistorial[];
  total: number;
  pagina: number;
  porPagina: number;
};

// ---------------------------------------------------------------------------
// Filtros para el listado
// ---------------------------------------------------------------------------

export type FiltrosProspectos = {
  // Si se omite, el backend devuelve solo ACTIVO (contrato §5.2). No existe
  // "todos los estados" en una sola llamada: para ver Convertidos/Descartados
  // hay que pedir ese estado explicitamente.
  estado?: EstadoProspecto;
  idEjecutivoResponsable?: string;
  // Texto: nombre comercial, razon social o numero de documento (RUC/DNI/CE).
  busqueda?: string;
  // Rango sobre la fecha de creacion (ISO 8601).
  fechaDesde?: string;
  fechaHasta?: string;
  // Opt-in: si es true, el backend devuelve tambien los eliminados (estadoRegistro=false)
  // junto con los activos. Ausente/false = solo activos.
  incluirEliminados?: boolean;
  pagina?: number;
  porPagina?: number;
};

// ---------------------------------------------------------------------------
// Payloads de request
// ---------------------------------------------------------------------------

export type PayloadContactoInicial = {
  nombre: string;
  cargo?: string;
  telefono?: string;
  email: string;
  observaciones?: string;
  // esPrincipal NO se envia al registrar: el backend marca el contacto inicial
  // como principal. esPrincipal solo viaja al agregar un contacto (ver PayloadAgregarContacto).
};

export type PayloadRegistrarProspecto = {
  nombreComercial?: string;
  razonSocial: string;
  direccion: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  medioContactoInicial: MedioContactoInicial;
  contactoInicial: PayloadContactoInicial;
  // idEjecutivoResponsable se asigna automaticamente en el backend (no se envia)
};

export type PayloadActualizarProspecto = {
  nombreComercial?: string;
  razonSocial?: string;
  direccion?: string;
  tipoDocumento?: TipoDocumento;
  numeroDocumento?: string;
  medioContactoInicial?: MedioContactoInicial;
  // Spec 5.4: el ejecutivo responsable puede reasignarse via PATCH
  idEjecutivoResponsable?: string;
};

export type PayloadDescartarProspecto = {
  motivo: string;
};

export type PayloadAgregarContacto = {
  nombre: string;
  cargo?: string;
  telefono?: string;
  email: string;
  // Spec 5.7: observaciones opcionales al agregar un contacto
  observaciones?: string;
  esPrincipal: boolean;
};

// Editar contacto (§5.10): parcial, todos opcionales. NO incluye esPrincipal
// (eso se cambia por su endpoint dedicado, ver cambiarContactoPrincipal).
export type PayloadEditarContacto = {
  nombre?: string;
  cargo?: string;
  telefono?: string;
  email?: string;
  observaciones?: string;
};
