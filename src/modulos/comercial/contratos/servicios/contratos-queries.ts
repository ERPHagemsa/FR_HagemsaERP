"use client"

import { invalidarConsulta, useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"
import {
  CLAVE_CONTRATOS,
  CLAVE_CONTRATO_DETALLE,
  CLAVE_TARIFARIOS,
  CLAVE_TARIFARIO_CONSOLIDADO,
} from "@/modulos/comercial/claves-consulta"

import {
  consultarContrato,
  consultarTarifarioConsolidado,
  crearContratoDesdeTarifario,
  listarContratos,
} from "./contratos-api"
import type {
  FiltrosContratos,
  PayloadCrearContratoDesdeTarifario,
} from "../tipos/contratos.tipos"

export interface OpcionesMutacion {
  onSuccess?: () => unknown
  onError?: (err: unknown) => unknown
}

export function useContratosQuery(filtros?: FiltrosContratos) {
  return useConsulta(
    () => listarContratos(filtros),
    [JSON.stringify(filtros ?? {})],
    { clave: CLAVE_CONTRATOS },
  )
}

export function useContratoDetalleQuery(id: string) {
  return useConsulta(() => consultarContrato(id), [id], {
    enabled: Boolean(id),
    clave: CLAVE_CONTRATO_DETALLE,
  })
}

export function useTarifarioConsolidadoQuery(idClienteExterno: string) {
  return useConsulta(
    () => consultarTarifarioConsolidado(idClienteExterno),
    [idClienteExterno],
    {
      enabled: Boolean(idClienteExterno),
      clave: CLAVE_TARIFARIO_CONSOLIDADO,
    },
  )
}

// El contrato nace de un tarifario: hereda cliente + cotizacion origen y queda
// vinculado en un solo paso. Invalida contratos y tarifarios (el tarifario pasa
// a origen CONTRATO).
export function useCrearContratoDesdeTarifarioMutation(
  idTarifario: string,
  opciones: OpcionesMutacion = {},
) {
  return useMutar<PayloadCrearContratoDesdeTarifario, { id: string }>({
    fn: (payload) => crearContratoDesdeTarifario(idTarifario, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_CONTRATOS)
      invalidarConsulta(CLAVE_TARIFARIOS)
      opciones.onSuccess?.()
    },
    onError: (err) => opciones.onError?.(err),
  })
}
