export type EstadoCuenta = "activo" | "suspendido" | "inactivo"
export type TipoCuenta = "interno" | "cliente" | "proveedor"

export interface CuentaResponse {
  readonly id: string
  readonly email: string
  readonly nombreCompleto: string
  readonly tipoCuenta: TipoCuenta
  readonly estado: EstadoCuenta
  readonly documentoIdentidad: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export interface ListaCuentasResponse {
  readonly items: ReadonlyArray<CuentaResponse>
  readonly total: number
  readonly offset: number
  readonly limit: number
}

export interface ListarCuentasQuery {
  estado?: EstadoCuenta
  tipoCuenta?: TipoCuenta
  busqueda?: string
  offset?: number
  limit?: number
}

export interface CrearCuentaPayload {
  email: string
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
  readonly items: ReadonlyArray<RolResponse>
}

export interface CrearRolPayload {
  nombre: string
  descripcion: string
  esSistema?: boolean
}

export interface CrearRolResponse {
  readonly id: string
}

export interface PermisoResponse {
  readonly id: string
  readonly codigo: string
  readonly descripcion: string
  readonly modulo: string
}

export interface ListaPermisosResponse {
  readonly items: ReadonlyArray<PermisoResponse>
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
  readonly items: ReadonlyArray<AsignacionResponse>
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
