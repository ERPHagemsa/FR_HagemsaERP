export type TipoSocioDeNegocio = "CLIENTE" | "PROVEEDOR" | "PERSONAL"

export type EstadoSocioDeNegocio = "ACTIVO" | "INACTIVO"

export type EstadoRegistro = "VIGENTE" | "ANULADO"

export type FormatoExportacionSocios = "EXCEL" | "PDF"

export interface PaginationMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  meta: PaginationMeta
}

export interface SocioDeNegocioResponse {
  id: string
  codigoInternoSap: string
  tipo: TipoSocioDeNegocio
  numeroDocumento: string
  razonSocial: string
  nombreComercial: string
  direccion: string
  contacto: string
  correo: string
  numeroCelular: string
  estado: EstadoSocioDeNegocio
  estadoRegistro: EstadoRegistro
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion: string
  usuarioModificacion: string
  puestoTrabajo: string
  sede: string
  area: string
  contrato: string
  cuenta: string
  motivoBaja: string
  fechaBaja: string
  usuarioBajaId: string
}

export interface EstadoBcResponse {
  boundedContext: string
  agregado: string
}

export interface RegistrarSocioDeNegocioRequest {
  codigoInternoSap: string
  tipo: TipoSocioDeNegocio
  numeroDocumento: string
  razonSocial: string
  nombreComercial: string
  direccion: string
  contacto: string
  correo: string
  numeroCelular: string
  puestoTrabajo?: string
  sede?: string
  area?: string
  contrato?: string
  cuenta?: string
  usuarioId?: string
}

export type RegistrarClienteDesdeComercialRequest =
  RegistrarSocioDeNegocioRequest & { tipo: "CLIENTE" }

export interface ModificarSocioDeNegocioRequest {
  razonSocial?: string
  nombreComercial?: string
  direccion?: string
  contacto?: string
  correo?: string
  numeroCelular?: string
  puestoTrabajo?: string
  sede?: string
  area?: string
  contrato?: string
  cuenta?: string
  usuarioId: string
}

export interface DarDeBajaSocioDeNegocioRequest {
  motivo: string
  usuarioId: string
  estadoRegistro?: EstadoRegistro
}

export interface ReactivarSocioDeNegocioRequest {
  usuarioId: string
}

export interface ConsultarSociosDeNegocioQuery {
  tipo?: TipoSocioDeNegocio
  estado?: EstadoSocioDeNegocio
  estadoRegistro?: EstadoRegistro
  numeroDocumento?: string
  codigoInternoSap?: string
  area?: string
  puestoTrabajo?: string
  sede?: string
  contrato?: string
  cuenta?: string
  page?: number
  pageSize?: number
}

export interface ExportarSociosDeNegocioQuery
  extends ConsultarSociosDeNegocioQuery {
  formato: FormatoExportacionSocios
}

export interface ReporteSociosDeNegocioResponse {
  nombreArchivo: string
  formato: FormatoExportacionSocios
  contenido: string
}
