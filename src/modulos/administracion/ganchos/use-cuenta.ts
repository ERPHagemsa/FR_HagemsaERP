"use client"

import { useConsulta } from "@/compartido/api/use-consulta"

import { obtenerCuenta } from "../servicios/cuentas-api"

export function useCuenta(id: string) {
  return useConsulta(() => obtenerCuenta(id), [id], { enabled: Boolean(id) })
}
