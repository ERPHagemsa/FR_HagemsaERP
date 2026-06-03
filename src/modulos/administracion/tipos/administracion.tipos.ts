import type { Paginacion } from "@/compartido/api/contrato"

export type EstadoCuenta = "activo" | "suspendido" | "inactivo"
export type TipoCuenta = "interno" | "cliente" | "proveedor"

export interface CuentaResponse {
  readonly id: string
  readonly email: string
  readonly nombreUsuario: string
  readonly nombreCompleto: string
  readonly tipoCuenta: TipoCuenta
  readonly estado: EstadoCuenta
  readonly documentoIdentidad: string | null
  readonly createdAt: string
  readonly updatedAt: string
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

export interface CrearCuentaPayload {
  email: string
  nombreUsuario: string
  nombreCompleto: string
  tipoCuenta: TipoCuenta
  documentoIdentidad?: string
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
  nombreCompleto?: string
  documentoIdentidad?: string | null
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
