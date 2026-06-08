import { clienteHttp } from "@/compartido/api/cliente-http"
import type { RespuestaPaginada } from "@/compartido/api/contrato"

import type {
  EventoAuditoriaResponse,
  ListaEventosAuditoriaResponse,
  ListarEventosAuditoriaQuery,
} from "../tipos/administracion.tipos"

// El backend expone /api/admin/audit/events con paginacion por offset bajo el
// envoltura paginada estandar del backend ({datos, paginacion}). Aqui solo desempacamos.

function construirQuery(filtros: ListarEventosAuditoriaQuery): string {
  const params = new URLSearchParams()
  if (filtros.cuentaId) params.set("cuentaId", filtros.cuentaId)
  if (filtros.tipo) params.set("tipo", filtros.tipo)
  if (filtros.desde) params.set("desde", filtros.desde)
  if (filtros.hasta) params.set("hasta", filtros.hasta)
  if (filtros.pagina !== undefined) params.set("pagina", String(filtros.pagina))
  if (filtros.limite !== undefined) params.set("limite", String(filtros.limite))
  const s = params.toString()
  return s ? `?${s}` : ""
}

export async function obtenerEventosAuditoria(
  filtros: ListarEventosAuditoriaQuery = {},
): Promise<ListaEventosAuditoriaResponse> {
  const { data } = await clienteHttp.get<
    RespuestaPaginada<EventoAuditoriaResponse>
  >(`/api/admin/audit/events${construirQuery(filtros)}`)
  return { datos: data.datos, paginacion: data.paginacion }
}
