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
  id: number;
  nombre: string;
  cargo: string | null;
  telefono: string | null;
  email: string | null;
  observaciones: string | null;
  esPrincipal: boolean;
};

export type Prospecto = {
  id: number;
  nombreComercial: string;
  razonSocial: string | null;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  medioContactoInicial: MedioContactoInicial;
  estado: EstadoProspecto;
  idEjecutivoResponsable: string;
  motivoDescarte: string | null;
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
// Filtros para el listado
// ---------------------------------------------------------------------------

export type FiltrosProspectos = {
  estado?: EstadoProspecto;
  idEjecutivoResponsable?: string;
  busqueda?: string;
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
  email?: string;
  observaciones?: string;
  esPrincipal: boolean;
};

export type PayloadRegistrarProspecto = {
  nombreComercial: string;
  razonSocial?: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  medioContactoInicial: MedioContactoInicial;
  contactoInicial: PayloadContactoInicial;
  // idEjecutivoResponsable se asigna automaticamente en el backend (no se envia)
};

export type PayloadActualizarProspecto = {
  nombreComercial?: string;
  razonSocial?: string;
  tipoDocumento?: TipoDocumento;
  numeroDocumento?: string;
  medioContactoInicial?: MedioContactoInicial;
};

export type PayloadDescartarProspecto = {
  motivo: string;
};

export type PayloadAgregarContacto = {
  nombre: string;
  cargo?: string;
  telefono?: string;
  email?: string;
  esPrincipal: boolean;
};
