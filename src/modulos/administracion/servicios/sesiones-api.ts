import { clienteHttp } from "@/compartido/api/cliente-http"
import type { RespuestaPaginada } from "@/compartido/api/contrato"

import type {
  ListaSesionesResponse,
  RevocarSesionPayload,
  SesionResponse,
} from "../tipos/administracion.tipos"

// Sesiones activas por cuenta son pocas (~3-5) — el backend las devuelve en
// una sola pagina pero ya envueltas en {datos, paginacion} igual que el resto.

export async function obtenerSesionesCuenta(
  cuentaId: string,
): Promise<ListaSesionesResponse> {
  const { data } = await clienteHttp.get<RespuestaPaginada<SesionResponse>>(
    `/api/admin/cuentas/${cuentaId}/sesiones`,
  )
  return { datos: data.datos, paginacion: data.paginacion }
}

export async function revocarSesion(
  sesionId: string,
  payload: RevocarSesionPayload,
): Promise<void> {
  await clienteHttp.post(`/api/admin/sesiones/${sesionId}/revocar`, payload)
}
