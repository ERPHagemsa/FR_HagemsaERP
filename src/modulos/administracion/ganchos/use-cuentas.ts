"use client"

import { useConsulta } from "@/compartido/api/use-consulta"

import { obtenerCuentas } from "../servicios/cuentas-api"
import type { ListarCuentasQuery } from "../tipos/administracion.tipos"

export function useCuentas(query: ListarCuentasQuery = {}) {
  return useConsulta(() => obtenerCuentas(query), [
    query.estado,
    query.tipoCuenta,
    query.busqueda,
    query.offset,
    query.limit,
  ])
}
