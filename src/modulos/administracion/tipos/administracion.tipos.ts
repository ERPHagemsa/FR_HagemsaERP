import type { Paginacion } from "@/compartido/api/contrato"

export type EstadoCuenta = "activo" | "suspendido" | "inactivo"
export type TipoCuenta = "interno" | "cliente" | "proveedor"

// Socio de negocio (BC01) vinculado a la cuenta, con su snapshot completo.
// Solo viene en el detalle (GET /admin/cuentas/:id) y si la cuenta tiene socio.
export interface SocioAsignado {
  readonly socioExternoId: number
  readonly tipo: string
  readonly codigoSocio: string
  readonly codigoCuenta: string
  readonly nombre: string | null
  readonly documento: string | null
  readonly snapshot: Record<string, unknown> | null
}

export interface CuentaResponse {
  readonly id: string
  readonly email: string
  readonly nombreUsuario: string
  readonly nombreCompleto: string
  readonly tipoCuenta: TipoCuenta
  readonly estado: EstadoCuenta
  readonly documentoIdentidad: string | null
  // Codigos internos de la cuenta (para PDFs), independientes del socio de BC01.
  // null si la cuenta no los tiene seteados.
  readonly codigoSocio: string | null
  readonly codigoCuenta: string | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly socio?: SocioAsignado | null
}

// Resultado del listado tras desempaquetar la respuesta del backend
// ({ datos, paginacion } → { datos: [...], paginacion: {...} }).
export interface ListaCuentasResponse {
  readonly datos: ReadonlyArray<CuentaResponse>
  readonly paginacion: Paginacion
}

export interface ListarCuentasQuery {
  estado?: EstadoCuenta
  tipoCuenta?: TipoCuenta
  busqueda?: string
  pagina?: number
  limite?: number
}

// Tipo de socio de negocio (BC01). Por ahora solo se usa "empleado"; el
// backend acepta el enum completo para futuros clientes/proveedores.
export type TipoSocio = "empleado" | "cliente" | "proveedor"

export interface CrearCuentaPayload {
  email: string
  nombreUsuario: string
  nombreCompleto: string
  tipoCuenta: TipoCuenta
  documentoIdentidad?: string
  // Vinculo opcional con un socio de negocio de BC01. Es "todo-o-nada": si se
  // envia uno de los tres, el backend exige los tres. Los codigos son 2
  // alfanumericos; socioExternoId es el personalId de BC01.
  socioExternoId?: number
  codigoSocio?: string
  codigoCuenta?: string
  tipoSocio?: TipoSocio
  // Snapshot completo del socio (objeto de BC01) para denormalizar en el backend.
  socioSnapshot?: Record<string, unknown>
}

export interface CrearCuentaResponse {
  readonly id: string
}

export interface SuspenderCuentaPayload {
  razon: string
}

// PATCH /admin/cuentas/:id — campos opcionales.
// nombreCompleto y documentoIdentidad estan listados como modificables. Email
// y tipoCuenta NO son editables (el backend no lo expone — son inmutables).
export interface ActualizarCuentaPayload {
  // El correo es editable y puede repetirse entre cuentas. El nombre de usuario
  // NO: es la llave de acceso y es inmutable.
  email?: string
  nombreCompleto?: string
  documentoIdentidad?: string | null
}

// PATCH /admin/cuentas/:id/codigos — setea, edita o limpia los codigos internos.
// "Todo o nada": ambos presentes (setear/editar) o ambos null (limpiar).
export interface ActualizarCodigosPayload {
  codigoSocio: string | null
  codigoCuenta: string | null
}

// POST /admin/cuentas/:id/vincular-socio — vincula un socio de BC01 a una cuenta
// existente. Solo socioExternoId es obligatorio; tipo y snapshot son opcionales.
export interface VincularSocioPayload {
  socioExternoId: number
  tipoSocio?: TipoSocio
  socioSnapshot?: Record<string, unknown>
}

// DELETE /admin/cuentas/:id — desactivacion logica con razon obligatoria.
export interface DesactivarCuentaPayload {
  razon: string
}

export interface SetPasswordPayload {
  password: string
}

export interface ResetPasswordResponse {
  readonly passwordTemporal: string
}

export interface RolResponse {
  readonly id: string
  readonly nombre: string
  readonly descripcion: string
  readonly esSistema: boolean
  readonly permisos: ReadonlyArray<string>
  readonly createdAt: string
  readonly updatedAt: string
}

export interface ListaRolesResponse {
  readonly datos: ReadonlyArray<RolResponse>
  readonly paginacion: Paginacion
}

export interface ListarRolesQuery {
  pagina?: number
  limite?: number
}

export interface CrearRolPayload {
  nombre: string
  descripcion: string
  esSistema?: boolean
}

export interface CrearRolResponse {
  readonly id: string
}

export interface ActualizarRolPayload {
  nombre?: string
  descripcion?: string
}

export interface CrearPermisoPayload {
  codigo: string
  descripcion: string
  modulo?: string
}

export interface CrearPermisoResponse {
  readonly id: string
}

export interface ActualizarPermisoPayload {
  descripcion: string
}

export interface PermisoResponse {
  readonly id: string
  readonly codigo: string
  readonly descripcion: string
  readonly modulo: string
}

export interface AgregarPermisoARolPayload {
  codigoPermiso: string
}

export interface ListaPermisosResponse {
  readonly datos: ReadonlyArray<PermisoResponse>
  readonly paginacion: Paginacion
}

export interface ListarPermisosQuery {
  pagina?: number
  limite?: number
  busqueda?: string
}

export interface AsignacionResponse {
  readonly id: string
  readonly rolId: string
  readonly scope: Record<string, unknown>
  readonly asignadoEn: string
  readonly expiraEn: string | null
  readonly revocadaEn: string | null
  readonly activa: boolean
}

export interface ListaAsignacionesResponse {
  readonly datos: ReadonlyArray<AsignacionResponse>
  readonly paginacion: Paginacion
}

export interface AsignarRolPayload {
  rolId: string
  scope: Record<string, unknown>
  expiraEn?: string
}

export interface AsignarRolResponse {
  readonly id: string
}

export interface RevocarAsignacionPayload {
  razon: string
}

export interface CambiarScopeAsignacionPayload {
  scope: Record<string, unknown>
}

export interface SesionResponse {
  readonly id: string
  readonly jti: string
  readonly userAgent: string | null
  readonly ipAddress: string | null
  readonly emitidaEn: string
  readonly expiraEn: string
}

export interface ListaSesionesResponse {
  readonly datos: ReadonlyArray<SesionResponse>
  readonly paginacion: Paginacion
}

export interface RevocarSesionPayload {
  razon: string
}

// Tipos canonicos del backend (auth.events.tipo). Se persisten como string
// para permitir agregar tipos sin migracion, asi que se acepta cualquier
// string al filtrar pero estos son los conocidos para el dropdown.
export const TIPOS_EVENTO_AUTH = [
  "login_exitoso",
  "login_fallido",
  "logout",
  "credencial_bloqueada",
  "password_cambiado",
  "password_reset_solicitado",
  "password_reset_completado",
  "cuenta_creada",
  "cuenta_suspendida",
  "cuenta_reactivada",
  "cuenta_desactivada",
  "rol_asignado",
  "asignacion_revocada",
  "sesion_revocada_admin",
  "token_reusado",
  "service_token_emitido",
] as const

export type TipoEventoAuth = (typeof TIPOS_EVENTO_AUTH)[number]

export interface EventoAuditoriaResponse {
  readonly id: string
  readonly cuentaId: string | null
  readonly tipo: string
  readonly metadata: Record<string, unknown>
  readonly ipAddress: string | null
  readonly userAgent: string | null
  readonly ocurridoEn: string
}

export interface ListaEventosAuditoriaResponse {
  readonly datos: ReadonlyArray<EventoAuditoriaResponse>
  readonly paginacion: Paginacion
}

export interface ListarEventosAuditoriaQuery {
  cuentaId?: string
  tipo?: string
  desde?: string
  hasta?: string
  pagina?: number
  limite?: number
}

// ===== Clientes de servicio (M2M) =====================================

export type EstadoServiceClient = "activo" | "suspendido"

// Metadata de un secreto — nunca el hash ni el valor en claro.
export interface SecretoServiceClient {
  readonly id: string
  readonly etiqueta: string | null
  readonly activo: boolean
  readonly createdAt: string
  readonly expiraEn: string | null
  readonly revocadoEn: string | null
}

export interface RolServiceClient {
  readonly rolId: string
  readonly scope: Record<string, unknown>
}

export interface ServiceClientResponse {
  readonly id: string
  readonly clientId: string
  readonly nombre: string
  readonly descripcion: string | null
  readonly estado: EstadoServiceClient
  readonly roles: ReadonlyArray<RolServiceClient>
  readonly secretos: ReadonlyArray<SecretoServiceClient>
  readonly createdAt: string
  readonly updatedAt: string
}

export interface ListaServiceClientsResponse {
  readonly datos: ReadonlyArray<ServiceClientResponse>
  readonly paginacion: Paginacion
}

export interface ListarServiceClientsQuery {
  estado?: EstadoServiceClient
  busqueda?: string
  pagina?: number
  limite?: number
}

// Un rol asignado al cliente (scope opcional; {} = global).
export interface RolAsignadoInput {
  rolId: string
  scope?: Record<string, unknown>
}

export interface CrearServiceClientPayload {
  clientId: string
  nombre: string
  descripcion?: string
  roles?: RolAsignadoInput[]
}

// El `secret` viaja UNA sola vez, al crear. No se puede recuperar despues.
export interface CrearServiceClientResponse {
  readonly id: string
  readonly clientId: string
  readonly secret: string
}

export interface RotarSecretoPayload {
  // Segundos de gracia antes de expirar el secreto viejo (si se omite, queda
  // activo hasta revocarlo a mano). Permite rotacion con solapamiento.
  graciaSegundos?: number
}

export interface RotarSecretoResponse {
  readonly secret: string
}

export interface AsignarRolesServiceClientPayload {
  roles: RolAsignadoInput[]
}
