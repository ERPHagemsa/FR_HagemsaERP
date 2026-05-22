export type TipoSocioDeNegocio = "CLIENTE" | "PROVEEDOR" | "PERSONAL"

export type EstadoSocioDeNegocio = "ACTIVO" | "INACTIVO"

export type FormatoExportacionSocios = "EXCEL" | "PDF"

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
  puestoTrabajo: string
  sede: string
  area: string
  contrato: string
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
  usuarioId?: string
  origenOperacion?: string
}

export interface RegistrarClienteDesdeComercialRequest {
  codigoInternoSap: string
  tipo: "CLIENTE"
  numeroDocumento: string
  razonSocial: string
  nombreComercial: string
  direccion: string
  contacto: string
  correo: string
  numeroCelular: string
  usuarioId?: string
}

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
  usuarioId: string
}

export interface DarDeBajaSocioDeNegocioRequest {
  motivo: string
  usuarioId: string
}

export interface ConsultarSociosDeNegocioQuery {
  tipo?: TipoSocioDeNegocio
  estado?: EstadoSocioDeNegocio
  numeroDocumento?: string
  codigoInternoSap?: string
  area?: string
  puestoTrabajo?: string
  sede?: string
  contrato?: string
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
