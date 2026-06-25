import { clienteSocioNegocios } from "@/compartido/api/clientes-backend"

import type { RespuestaDto } from "../tipos/socio-negocio"
import type {
  AsignacionPersonalHistorialResponse,
  AsignacionPersonalResponse,
  ConfiguracionGeneralOpcionResponse,
  ConsultarConfiguracionGeneralOpcionesQuery,
  CrearAsignacionPersonalRequest,
  DecidirAprobacionCuentaContratoRequest,
  ModificarAsignacionPersonalRequest,
  OpcionesFormularioAsignacionResponse,
  ReemplazarCuentasContratosRequest,
} from "../tipos/asignacion-personal"

const BASE_ENDPOINT = "/asignaciones-personal"
const ASIGNACIONES_CACHE_MS = 10_000

const asignacionesCache = new Map<
  string,
  { datos: AsignacionPersonalResponse[]; expiraEn: number }
>()
const asignacionesEnCurso = new Map<string, Promise<AsignacionPersonalResponse[]>>()
const versionesAsignaciones = new Map<string, number>()

export function invalidarAsignacionesPorPersonal(personalId: string | number) {
  const clave = String(personalId)
  asignacionesCache.delete(clave)
  asignacionesEnCurso.delete(clave)
  versionesAsignaciones.set(clave, (versionesAsignaciones.get(clave) ?? 0) + 1)
}

export async function crearAsignacionPersonal(
  payload: CrearAsignacionPersonalRequest,
): Promise<AsignacionPersonalResponse> {
  const { data } = await clienteSocioNegocios.post<
    RespuestaDto<AsignacionPersonalResponse>
  >(BASE_ENDPOINT, payload)
  invalidarAsignacionesPorPersonal(payload.personalId)
  return data.datos
}

export async function consultarAsignacionesPorPersonal(
  personalId: string | number,
): Promise<AsignacionPersonalResponse[]> {
  const clave = String(personalId)
  const cache = asignacionesCache.get(clave)
  if (cache && cache.expiraEn > Date.now()) return cache.datos

  const consultaEnCurso = asignacionesEnCurso.get(clave)
  if (consultaEnCurso) return consultaEnCurso

  const version = versionesAsignaciones.get(clave) ?? 0
  const consulta = clienteSocioNegocios
    .get<RespuestaDto<AsignacionPersonalResponse[]>>(
      `${BASE_ENDPOINT}/personal/${encodeURIComponent(clave)}`,
    )
    .then(({ data }) => {
      if ((versionesAsignaciones.get(clave) ?? 0) === version) {
        asignacionesCache.set(clave, {
          datos: data.datos,
          expiraEn: Date.now() + ASIGNACIONES_CACHE_MS,
        })
      }
      return data.datos
    })
    .finally(() => {
      if (asignacionesEnCurso.get(clave) === consulta) {
        asignacionesEnCurso.delete(clave)
      }
    })

  asignacionesEnCurso.set(clave, consulta)
  return consulta
}

/**
 * Trae en una sola llamada todas las opciones para el formulario de asignacion:
 * cargos, sedes, areas, cuentas, contratos (desde Configuracion General, ya
 * resueltos por BC-01), tipos de tareo, configuraciones laborales y los
 * catalogos de disponibilidad. Reemplaza el patron de pedir combo por combo.
 */
export async function obtenerOpcionesFormularioAsignacion(
  soloActivos = true,
): Promise<OpcionesFormularioAsignacionResponse> {
  const query = soloActivos ? "" : "?soloActivos=false"
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<OpcionesFormularioAsignacionResponse>
  >(`${BASE_ENDPOINT}/opciones-formulario${query}`)
  return data.datos
}

/**
 * Lista opciones de Configuracion General ya resueltas por BC-01 para un combo
 * puntual (o varios via `tiposDatoMaestro`). Para inicializar el formulario
 * completo, preferir `obtenerOpcionesFormularioAsignacion`.
 */
export async function consultarOpcionesConfiguracionGeneral(
  query?: ConsultarConfiguracionGeneralOpcionesQuery,
): Promise<ConfiguracionGeneralOpcionResponse[]> {
  const params = new URLSearchParams()
  if (query?.tipoDatoMaestro) params.set("tipoDatoMaestro", query.tipoDatoMaestro)
  if (query?.tiposDatoMaestro?.length) {
    params.set("tiposDatoMaestro", query.tiposDatoMaestro.join(","))
  }
  if (query?.busqueda) params.set("busqueda", query.busqueda)
  if (query?.soloActivos === false) params.set("soloActivos", "false")
  const queryString = params.toString()

  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<ConfiguracionGeneralOpcionResponse[]>
  >(`${BASE_ENDPOINT}/configuracion-general/opciones${queryString ? `?${queryString}` : ""}`)
  return data.datos
}

export async function obtenerAsignacionPersonal(
  id: string | number,
): Promise<AsignacionPersonalResponse> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<AsignacionPersonalResponse>
  >(`${BASE_ENDPOINT}/${encodeURIComponent(String(id))}`)
  return data.datos
}

export async function consultarHistorialAsignacionPersonal(
  id: string | number,
): Promise<AsignacionPersonalHistorialResponse[]> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<AsignacionPersonalHistorialResponse[]>
  >(`${BASE_ENDPOINT}/${encodeURIComponent(String(id))}/historial`)
  return data.datos
}

export async function modificarAsignacionPersonal(
  id: string | number,
  payload: ModificarAsignacionPersonalRequest,
): Promise<AsignacionPersonalResponse> {
  const { data } = await clienteSocioNegocios.patch<
    RespuestaDto<AsignacionPersonalResponse>
  >(`${BASE_ENDPOINT}/${encodeURIComponent(String(id))}`, payload)
  invalidarAsignacionesPorPersonal(data.datos.personalId)
  return data.datos
}

export async function reemplazarCuentasContratos(
  id: string | number,
  payload: ReemplazarCuentasContratosRequest,
): Promise<AsignacionPersonalResponse> {
  const { data } = await clienteSocioNegocios.put<
    RespuestaDto<AsignacionPersonalResponse>
  >(`${BASE_ENDPOINT}/${encodeURIComponent(String(id))}/cuentas-contratos`, payload)
  invalidarAsignacionesPorPersonal(data.datos.personalId)
  return data.datos
}

/**
 * Aprueba una firma de aprobacion de un detalle cuenta/contrato. La decision es
 * secuencial: el backend solo deja decidir la firma pendiente de menor orden.
 */
export async function aprobarAprobacionCuentaContrato(
  id: string | number,
  detalleId: string | number,
  aprobacionId: string | number,
  payload: DecidirAprobacionCuentaContratoRequest = {},
): Promise<AsignacionPersonalResponse> {
  const { data } = await clienteSocioNegocios.patch<
    RespuestaDto<AsignacionPersonalResponse>
  >(
    `${BASE_ENDPOINT}/${encodeURIComponent(String(id))}/cuentas-contratos/${encodeURIComponent(
      String(detalleId),
    )}/aprobaciones/${encodeURIComponent(String(aprobacionId))}/aprobar`,
    payload,
  )
  invalidarAsignacionesPorPersonal(data.datos.personalId)
  return data.datos
}

/** Rechaza una firma de aprobacion; el detalle cuenta/contrato queda RECHAZADO. */
export async function rechazarAprobacionCuentaContrato(
  id: string | number,
  detalleId: string | number,
  aprobacionId: string | number,
  payload: DecidirAprobacionCuentaContratoRequest = {},
): Promise<AsignacionPersonalResponse> {
  const { data } = await clienteSocioNegocios.patch<
    RespuestaDto<AsignacionPersonalResponse>
  >(
    `${BASE_ENDPOINT}/${encodeURIComponent(String(id))}/cuentas-contratos/${encodeURIComponent(
      String(detalleId),
    )}/aprobaciones/${encodeURIComponent(String(aprobacionId))}/rechazar`,
    payload,
  )
  invalidarAsignacionesPorPersonal(data.datos.personalId)
  return data.datos
}
