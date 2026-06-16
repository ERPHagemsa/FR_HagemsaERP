import { clienteSocioNegocios } from "@/compartido/api/clientes-backend"

import type { RespuestaDto } from "../tipos/socio-negocio"
import type {
  AprobarAsignacionPersonalRequest,
  AsignacionPersonalHistorialResponse,
  AsignacionPersonalResponse,
  CrearAsignacionPersonalRequest,
  ModificarAsignacionPersonalRequest,
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

export async function aprobarAsignacionPersonal(
  id: string | number,
  payload: AprobarAsignacionPersonalRequest,
): Promise<AsignacionPersonalResponse> {
  const { data } = await clienteSocioNegocios.patch<
    RespuestaDto<AsignacionPersonalResponse>
  >(`${BASE_ENDPOINT}/${encodeURIComponent(String(id))}/aprobar`, payload)
  invalidarAsignacionesPorPersonal(data.datos.personalId)
  return data.datos
}
