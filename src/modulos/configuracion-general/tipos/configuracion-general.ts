export type TipoDatoMaestro =
  | "CARGO"
  | "UBICACION"
  | "SEDE"
  | "AREA"
  | "ALMACEN"
  | "REGIMEN"
  | "CUENTA"
  | "CONTRATO"

export type EstadoDatoMaestro = "ACTIVO" | "INACTIVO"

export type EstadoRegistro = "ACTIVO" | "ANULADO"

export type NivelArea = "GERENCIA" | "AREA"

// tipoUbicacion clasifica SOLO que es el lugar. No incluye operaciones ni
// temporalidad: PUNTO_CARGA/DESCARGA/ACOPIO se eliminaron (la operacion/actividad
// del punto pertenece a la parte operativa y se modelara a futuro, fuera de esta
// configuracion) y ALMACEN_TEMPORAL tambien (la temporalidad vive en
// Almacen.esTemporal). No reintroducir esos valores.
export type TipoUbicacion =
  | "SEDE"
  | "CLIENTE"
  | "PLANTA"
  | "MINA"
  | "PUERTO"
  | "PEAJE"
  | "ESTACIONAMIENTO"
  | "ALMACEN"
  | "PATIO"
  | "TERMINAL"
  | "OTRO"

export interface PaginationMeta {
  pagina: number
  limite: number
  total: number
  totalPaginas: number
  tieneSiguiente: boolean
  tieneAnterior: boolean
}

export interface PaginatedResponse<T> {
  datos: T[]
  paginacion: PaginationMeta
}

export interface EstadoBcConfiguracionGeneralResponse {
  boundedContext: string
  agregado: string
}

export interface ResumenConfiguracionGeneralResponse {
  totalMaestros: number
  activos: number
  inactivos: number
  anulados: number
  vigentesConsumibles: number
  porTipoDatoMaestro: Array<{
    tipoDatoMaestro: TipoDatoMaestro
    total: number
    activos: number
    inactivos: number
    anulados: number
    vigentesConsumibles: number
  }>
  porEstado: Array<{
    estado: EstadoDatoMaestro
    total: number
  }>
  porEstadoRegistro: Array<{
    estadoRegistro: EstadoRegistro
    total: number
  }>
}

export interface ConfiguracionGeneralResponse {
  // Los IDs son numericos incrementales POR TABLA (no UUID). Por eso el ciclo de
  // vida y el PUT generico exigen tipoDatoMaestro: un id se repite entre tablas.
  id: number
  // Identidad publica estable para integraciones y sincronizacion.
  // No usar para key visual en UI ni mostrarla en formularios.
  publicId?: string | null
  tipoDatoMaestro: TipoDatoMaestro
  codigo: string
  nombre: string
  descripcion?: string | null
  cargoSuperiorId?: number | null
  cargoSuperiorNombre?: string | null
  areaId?: number | null
  areaNombre?: string | null
  ubicacionId?: number | null
  ubicacionNombre?: string | null
  tipoUbicacion?: TipoUbicacion | null
  direccion?: string | null
  pais?: string | null
  departamento?: string | null
  codigoDepartamento?: string | null
  provincia?: string | null
  codigoProvincia?: string | null
  distrito?: string | null
  codigoDistrito?: string | null
  // Codigo INEI de 6 digitos devuelto por geo-peru-api al resolver el distrito.
  ubigeo?: string | null
  referenciaUbicacion?: string | null
  latitud?: number | null
  longitud?: number | null
  sedeId?: number | null
  sedeNombre?: string | null
  nivelArea?: NivelArea | null
  gerenciaId?: number | null
  gerenciaNombre?: string | null
  esTemporal?: boolean | null
  fechaInicio?: string | null
  fechaFin?: string | null
  regimenCodigo?: string | null
  diasTrabajo?: number | null
  diasDescanso?: number | null
  horasPorDia?: number | null
  // Asignado por el backend (profundidad en la jerarquia). Solo lectura.
  nivelCuentaContrato?: number | null
  contratoPadreId?: number | null
  contratoPadreNombre?: string | null
  estado: EstadoDatoMaestro
  estadoRegistro: EstadoRegistro
  motivoInhabilitacion?: string | null
  fechaInhabilitacion?: string | null
  usuarioInhabilitacionId?: string | null
  motivoAnulacion?: string | null
  fechaAnulacion?: string | null
  usuarioAnulacionId?: string | null
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion?: string | null
  usuarioModificacion?: string | null
}

export interface InhabilitarConfiguracionGeneralRequest {
  motivo: string
  usuarioModificacion: string
}

export interface ReactivarConfiguracionGeneralRequest {
  usuarioModificacion: string
}

export interface AnularConfiguracionGeneralRequest {
  motivo: string
  usuarioModificacion: string
}

export interface ConsultarConfiguracionGeneralQuery {
  tipoDatoMaestro?: TipoDatoMaestro
  estado?: EstadoDatoMaestro
  estadoRegistro?: EstadoRegistro
  codigo?: string
  nombre?: string
  // Filtros geograficos de UBICACION.
  tipoUbicacion?: TipoUbicacion
  pais?: string
  departamento?: string
  provincia?: string
  distrito?: string
  // Codigo ubigeo INEI exacto (6 digitos, ej. resuelto por geo-peru-api).
  ubigeo?: string
  // Filtros especificos por tipo (cada recurso dedicado los reconoce).
  cargoSuperiorId?: number
  areaId?: number
  ubicacionId?: number
  sedeId?: number
  nivelArea?: NivelArea
  gerenciaId?: number
  esTemporal?: boolean
  contratoPadreId?: number
  nivelCuentaContrato?: number
  page?: number
  pageSize?: number
  sortBy?:
    | "id"
    | "tipoDatoMaestro"
    | "codigo"
    | "nombre"
    | "estado"
    | "estadoRegistro"
    | "fechaCreacion"
  sortOrder?: "asc" | "desc"
}

export interface SedeJerarquiaResponse extends ConfiguracionGeneralResponse {
  areas?: ConfiguracionGeneralResponse[]
  almacenes?: ConfiguracionGeneralResponse[]
}

export interface UbicacionJerarquiaResponse extends ConfiguracionGeneralResponse {
  sedes?: SedeJerarquiaResponse[]
  almacenes?: ConfiguracionGeneralResponse[]
}

export type FormatoExportacionConfiguracionGeneral = "EXCEL" | "PDF"

export type ExportarConfiguracionGeneralQuery = ConsultarConfiguracionGeneralQuery & {
  formato?: FormatoExportacionConfiguracionGeneral
}

// ---------------------------------------------------------------------------
// Contrato por tipo de dato maestro
//
// El backend expone endpoints dedicados por tipo (/configuracion-general/cargos,
// /ubicaciones, /sedes, ...). Cada uno recibe SOLO los campos propios del tipo,
// sin el "mar de null" del payload generico. Estas interfaces modelan ese
// contrato: una base comun + los campos especificos de cada maestro.
// ---------------------------------------------------------------------------

/** Rutas (en plural) de cada tipo bajo el prefijo /configuracion-general. */
export const RUTA_POR_TIPO: Record<TipoDatoMaestro, string> = {
  CARGO: "cargos",
  UBICACION: "ubicaciones",
  SEDE: "sedes",
  AREA: "areas",
  ALMACEN: "almacenes",
  REGIMEN: "regimenes",
  CUENTA: "cuentas",
  CONTRATO: "contratos",
}

interface RegistrarBaseRequest {
  nombre: string
  descripcion?: string | null
  usuarioCreacion: string
}

interface ModificarBaseRequest {
  nombre?: string
  descripcion?: string | null
  usuarioModificacion: string
}

export interface RegistrarCargoRequest extends RegistrarBaseRequest {
  cargoSuperiorId?: number | null
  areaId: number
}
export interface ModificarCargoRequest extends ModificarBaseRequest {
  cargoSuperiorId?: number | null
  areaId?: number
}

export interface RegistrarUbicacionRequest extends RegistrarBaseRequest {
  tipoUbicacion?: TipoUbicacion
  pais?: string | null
  departamento?: string | null
  codigoDepartamento?: string | null
  provincia?: string | null
  codigoProvincia?: string | null
  distrito?: string | null
  codigoDistrito?: string | null
  // Codigos INEI resueltos por geo-peru-api (/distritos/por-punto o /buscar).
  ubigeo?: string | null
  direccion?: string | null
  referenciaUbicacion?: string | null
  // Coordenada en formato "latitud, longitud" (Google). El backend la separa y
  // redondea. Alternativa a enviar latitud/longitud por separado.
  coordenadasGoogle?: string
  coordenadas?: string
  latitud?: number | null
  longitud?: number | null
}
export interface ModificarUbicacionRequest extends ModificarBaseRequest {
  tipoUbicacion?: TipoUbicacion
  pais?: string | null
  departamento?: string | null
  codigoDepartamento?: string | null
  provincia?: string | null
  codigoProvincia?: string | null
  distrito?: string | null
  codigoDistrito?: string | null
  ubigeo?: string | null
  direccion?: string | null
  referenciaUbicacion?: string | null
  coordenadasGoogle?: string
  coordenadas?: string
  latitud?: number | null
  longitud?: number | null
}

export interface RegistrarSedeRequest extends RegistrarBaseRequest {
  ubicacionId: number
}
export interface ModificarSedeRequest extends ModificarBaseRequest {
  ubicacionId?: number
}

export interface RegistrarAreaRequest extends RegistrarBaseRequest {
  sedeId: number
  nivelArea?: NivelArea
  gerenciaId?: number | null
}
export interface ModificarAreaRequest extends ModificarBaseRequest {
  sedeId?: number
  nivelArea?: NivelArea
  gerenciaId?: number | null
}

export interface RegistrarAlmacenRequest extends RegistrarBaseRequest {
  ubicacionId: number
  sedeId: number
  esTemporal?: boolean
  fechaInicio?: string | null
  fechaFin?: string | null
}
export interface ModificarAlmacenRequest extends ModificarBaseRequest {
  ubicacionId?: number
  sedeId?: number
  esTemporal?: boolean
  fechaInicio?: string | null
  fechaFin?: string | null
}

export interface RegistrarRegimenRequest extends RegistrarBaseRequest {
  regimenCodigo: string
  diasTrabajo: number
  diasDescanso: number
  horasPorDia: number
}
export interface ModificarRegimenRequest extends ModificarBaseRequest {
  regimenCodigo?: string
  diasTrabajo?: number
  diasDescanso?: number
  horasPorDia?: number
}

// Cuenta no tiene campos propios al crear/editar: nombre + descripcion. El
// backend asigna nivelCuentaContrato.
export type RegistrarCuentaRequest = RegistrarBaseRequest
export type ModificarCuentaRequest = ModificarBaseRequest

export interface RegistrarContratoRequest extends RegistrarBaseRequest {
  // El padre (cuenta o contrato) solo se fija al crear; el backend deriva el nivel.
  contratoPadreId: number
}
// El PUT de contrato solo cambia nombre/descripcion; el padre es inmutable.
export type ModificarContratoRequest = ModificarBaseRequest

/** Mapa tipo -> request de registro, para tipar helpers genericos. */
export interface RegistrarRequestPorTipo {
  CARGO: RegistrarCargoRequest
  UBICACION: RegistrarUbicacionRequest
  SEDE: RegistrarSedeRequest
  AREA: RegistrarAreaRequest
  ALMACEN: RegistrarAlmacenRequest
  REGIMEN: RegistrarRegimenRequest
  CUENTA: RegistrarCuentaRequest
  CONTRATO: RegistrarContratoRequest
}

/** Mapa tipo -> request de modificacion. */
export interface ModificarRequestPorTipo {
  CARGO: ModificarCargoRequest
  UBICACION: ModificarUbicacionRequest
  SEDE: ModificarSedeRequest
  AREA: ModificarAreaRequest
  ALMACEN: ModificarAlmacenRequest
  REGIMEN: ModificarRegimenRequest
  CUENTA: ModificarCuentaRequest
  CONTRATO: ModificarContratoRequest
}
