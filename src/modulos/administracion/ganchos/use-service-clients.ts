"use client"

import { useConsulta } from "@/compartido/api/use-consulta"
import { useMutar } from "@/compartido/api/use-mutar"

import {
  asignarRolesServiceClient,
  crearServiceClient,
  obtenerServiceClient,
  obtenerServiceClients,
  reactivarServiceClient,
  revocarSecreto,
  rotarSecreto,
  suspenderServiceClient,
} from "../servicios/service-clients-api"
import type {
  AsignarRolesServiceClientPayload,
  CrearServiceClientPayload,
  CrearServiceClientResponse,
  ListarServiceClientsQuery,
  RotarSecretoPayload,
  RotarSecretoResponse,
} from "../tipos/administracion.tipos"

export function useServiceClients(query: ListarServiceClientsQuery = {}) {
  return useConsulta(() => obtenerServiceClients(query), [
    query.estado,
    query.busqueda,
    query.pagina,
    query.limite,
  ])
}

export function useServiceClient(id: string) {
  return useConsulta(() => obtenerServiceClient(id), [id], {
    enabled: Boolean(id),
  })
}

export interface OpcionesMutacion {
  readonly onSuccess?: () => unknown
}

export interface OpcionesCrearServiceClient {
  readonly onSuccess?: (data: CrearServiceClientResponse) => unknown
}

export function useCrearServiceClient(opciones: OpcionesCrearServiceClient = {}) {
  return useMutar<CrearServiceClientPayload, CrearServiceClientResponse>({
    fn: (payload) => crearServiceClient(payload),
    onSuccess: (data) => opciones.onSuccess?.(data),
  })
}

export interface OpcionesRotarSecreto {
  readonly onSuccess?: (data: RotarSecretoResponse) => unknown
}

export function useRotarSecreto(
  id: string,
  opciones: OpcionesRotarSecreto = {},
) {
  return useMutar<RotarSecretoPayload, RotarSecretoResponse>({
    fn: (payload) => rotarSecreto(id, payload),
    onSuccess: (data) => opciones.onSuccess?.(data),
  })
}

export function useRevocarSecreto(id: string, opciones: OpcionesMutacion = {}) {
  return useMutar<string, void>({
    fn: (secretoId) => revocarSecreto(id, secretoId),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useSuspenderServiceClient(
  id: string,
  opciones: OpcionesMutacion = {},
) {
  return useMutar<void, void>({
    fn: () => suspenderServiceClient(id),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useReactivarServiceClient(
  id: string,
  opciones: OpcionesMutacion = {},
) {
  return useMutar<void, void>({
    fn: () => reactivarServiceClient(id),
    onSuccess: () => opciones.onSuccess?.(),
  })
}

export function useAsignarRolesServiceClient(
  id: string,
  opciones: OpcionesMutacion = {},
) {
  return useMutar<AsignarRolesServiceClientPayload, void>({
    fn: (payload) => asignarRolesServiceClient(id, payload),
    onSuccess: () => opciones.onSuccess?.(),
  })
}
