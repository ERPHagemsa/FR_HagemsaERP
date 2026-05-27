"use client"

import { useConsulta } from "@/compartido/api/use-consulta"

import { obtenerEventosAuditoria } from "../servicios/audit-api"
import type { ListarEventosAuditoriaQuery } from "../tipos/administracion.tipos"

export function useEventosAuditoria(
  query: ListarEventosAuditoriaQuery = {},
) {
  return useConsulta(() => obtenerEventosAuditoria(query), [
    query.cuentaId,
    query.tipo,
    query.desde,
    query.hasta,
    query.pagina,
    query.limite,
  ])
}
