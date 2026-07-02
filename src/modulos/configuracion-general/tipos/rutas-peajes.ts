import type {
  EstadoDatoMaestro,
  EstadoRegistro,
  PaginatedResponse,
} from "./configuracion-general"

export type { PaginatedResponse }

// ---------------------------------------------------------------------------
// Peajes
//
// Un peaje apunta a una ubicacion activa con tipoUbicacion = PEAJE y tiene una o
// mas tarifas vigentes. No forma parte del agregado generico de datos maestros:
// usa sus propios endpoints /configuracion-general/peajes.
// ---------------------------------------------------------------------------

export type TipoCobroPeaje = "NORMAL" | "PEX"
export type ModalidadCobroPeaje = "POR_UNIDAD" | "POR_EJE"
// Sentido de circulacion del peaje dentro de una ruta. Solo IDA o REGRESO; el
// backend ya no soporta AMBOS. Default IDA. Un peaje bidireccional se modela con
// dos asignaciones: una IDA y otra REGRESO.
export type SentidoPeajeRuta = "IDA" | "REGRESO"

export interface PeajeResponse {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  ubicacionId: number
  ubicacionNombre?: string | null
  estado: EstadoDatoMaestro
  estadoRegistro: EstadoRegistro
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion?: string | null
  usuarioModificacion?: string | null
}

export interface TarifaPeajeResponse {
  id: number
  tipoCobro: TipoCobroPeaje
  modalidadCobro: ModalidadCobroPeaje
  // Numero de ejes para tarifas especificas por ejes. Debe ser > 0.
  numeroEjes?: number | null
  monto: number
  moneda: string
  fechaInicio?: string | null
  fechaFin?: string | null
  estado?: EstadoDatoMaestro
}

export interface ConsultarPeajesQuery {
  codigo?: string
  nombre?: string
  ubicacionId?: number
  estado?: EstadoDatoMaestro
  estadoRegistro?: EstadoRegistro
  page?: number
  pageSize?: number
}

export interface RegistrarPeajeRequest {
  nombre: string
  ubicacionId: number
  usuarioCreacion?: string
}

export interface ModificarPeajeRequest {
  nombre?: string
  ubicacionId?: number
  usuarioModificacion?: string
}

// El front solo envia el precio unitario (`monto`). El backend genera la tabla
// POR_EJE (2..20) + una base POR_UNIDAD y desactiva las anteriores del mismo
// peaje + tipoCobro. `modalidadCobro` y `numeroEjes` los fuerza el backend: si se
// envian se ignoran, por eso no forman parte de este request.
export interface RegistrarTarifaPeajeRequest {
  monto: number
  tipoCobro?: TipoCobroPeaje
  moneda?: string
  fechaInicio?: string
  fechaFin?: string | null
}

export interface ModificarTarifaPeajeRequest {
  tipoCobro?: TipoCobroPeaje
  modalidadCobro?: ModalidadCobroPeaje
  numeroEjes?: number | null
  monto?: number
  moneda?: string
  fechaInicio?: string
  fechaFin?: string | null
  estado?: EstadoDatoMaestro
}

// ---------------------------------------------------------------------------
// Rutas
//
// Una ruta es una lista ordenada de ubicaciones (puntos), con exactamente un
// ORIGEN y un DESTINO, y opcionalmente peajes asignados entre tramos.
// ---------------------------------------------------------------------------

export type TipoPuntoRuta = "ORIGEN" | "PARADA" | "DESTINO"

export interface RutaResponse {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  estado: EstadoDatoMaestro
  estadoRegistro: EstadoRegistro
  fechaCreacion: string
  usuarioCreacion: string
  fechaModificacion?: string | null
  usuarioModificacion?: string | null
}

export interface PuntoRutaResponse {
  orden: number
  tipoPunto: TipoPuntoRuta
  ubicacionId: number
  ubicacionNombre?: string | null
}

export interface PeajeRutaResponse {
  orden: number
  peajeId: number
  peajeNombre?: string | null
  // Sentido en que aplica el peaje. Default IDA.
  sentido?: SentidoPeajeRuta | null
  // Si false, el peaje no suma en el calculo de costo. Default true.
  cobra?: boolean | null
  ubicacionId?: number | null
  ubicacionNombre?: string | null
  ubicacionDesdeId?: number | null
  ubicacionDesdeNombre?: string | null
  ubicacionHastaId?: number | null
  ubicacionHastaNombre?: string | null
  tarifas?: TarifaPeajeResponse[]
}

export interface RutaDetalleResponse extends RutaResponse {
  puntos: PuntoRutaResponse[]
  peajes: PeajeRutaResponse[]
}

export interface ConsultarRutasQuery {
  codigo?: string
  nombre?: string
  estado?: EstadoDatoMaestro
  estadoRegistro?: EstadoRegistro
  page?: number
  pageSize?: number
}

export interface RegistrarRutaRequest {
  nombre: string
  descripcion?: string | null
  usuarioCreacion?: string
}

export interface ModificarRutaRequest {
  nombre?: string
  descripcion?: string | null
  usuarioModificacion?: string
}

export interface PuntoRutaInput {
  orden: number
  ubicacionId: number
  tipoPunto: TipoPuntoRuta
}

export interface ActualizarPuntosRutaRequest {
  puntos: PuntoRutaInput[]
  usuarioModificacion?: string
}

export interface PeajeRutaInput {
  orden: number
  peajeId: number
  // Default IDA si no se envia.
  sentido?: SentidoPeajeRuta
  // Default true si no se envia (suma en el calculo de costo).
  cobra?: boolean
  // El tramo (desde/hasta) es opcional: solo se indica cuando el peaje se cobra
  // entre dos ubicaciones concretas de la ruta. Sin tramo, el peaje aplica al
  // recorrido completo.
  ubicacionDesdeId?: number | null
  ubicacionHastaId?: number | null
}

export interface ActualizarPeajesRutaRequest {
  peajes: PeajeRutaInput[]
  usuarioModificacion?: string
}

export interface CostoPeajesRutaResponse {
  rutaId?: number
  rutaNombre?: string | null
  tipoCobro?: TipoCobroPeaje
  // Default IDA. Devuelto por el calculo de costo segun el sentido consultado.
  sentido?: "IDA" | "REGRESO"
  numeroEjes?: number | string | null
  moneda?: string
  total?: number
  detalle?: Array<{
    peajeId: number
    peajeNombre?: string | null
    modalidadCobro?: ModalidadCobroPeaje
    montoBase?: number
    cantidad?: number
    subtotal: number
  }>
}

export interface ConsultarCostoPeajesQuery {
  tipoCobro: TipoCobroPeaje
  // Default IDA. Filtra peajes por sentido coincidente.
  sentido?: "IDA" | "REGRESO"
  // Obligatorio para tarifa generica POR_EJE.
  numeroEjes?: number
}

// Guarda puntos y peajes en una sola transaccion. El backend valida tramos
// contra los puntos del mismo request, asi que no hace falta guardar puntos
// antes para poder asignar tramos de peaje.
export interface ActualizarEstructuraRutaRequest {
  puntos: PuntoRutaInput[]
  peajes: PeajeRutaInput[]
  usuarioModificacion?: string
}

export interface ConsultarCostoResumenQuery {
  tipoCobro: TipoCobroPeaje
  sentido?: "IDA" | "REGRESO"
  // Lista separada por coma, p.ej. "2,3,4,5,6,7,8". LIVIANO = 2 ejes.
  numerosEjes?: string
}

export interface CostoPeajesResumenResponse {
  rutaId?: number
  rutaNombre?: string | null
  tipoCobro?: TipoCobroPeaje
  sentido?: "IDA" | "REGRESO"
  costos: Array<{
    etiqueta: string
    numeroEjes: number
    costo: CostoPeajesRutaResponse
  }>
}
