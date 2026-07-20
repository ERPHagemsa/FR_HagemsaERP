// Tipos del catálogo de motivos (admin). Espeja el contrato de BC-03
// (feature catalogo-motivo, controller catalogos-motivo).

export type TipoMotivo = "RECHAZO" | "NEGOCIACION"
export type EstadoCatalogoMotivo = "ACTIVO" | "INACTIVO"

export type CatalogoMotivo = {
  id: string
  codigo: string
  etiqueta: string
  tipo: TipoMotivo
  requiereDetalle: boolean
  ordenSugerido: number
  estado: EstadoCatalogoMotivo
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion: string | null
}

export type FiltrosCatalogosMotivo = {
  tipo?: TipoMotivo
  estado?: EstadoCatalogoMotivo
  busqueda?: string
  pagina?: number
  porPagina?: number
}

export type RespuestaPaginadaCatalogosMotivo = {
  data: CatalogoMotivo[]
  total: number
  pagina: number
  porPagina: number
}

export const ETIQUETAS_TIPO_MOTIVO: Record<TipoMotivo, string> = {
  RECHAZO: "Rechazo",
  NEGOCIACION: "Negociación",
}
