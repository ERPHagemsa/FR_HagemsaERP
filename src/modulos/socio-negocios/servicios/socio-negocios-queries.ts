"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/compartido/api"

import {
  consultarSociosDeNegocio,
  darDeBajaSocioDeNegocio,
  exportarSociosDeNegocio,
  modificarSocioDeNegocio,
  obtenerEstadoBcSocioDeNegocio,
  obtenerSocioDeNegocio,
  registrarClienteDesdeComercial,
  registrarSocioDeNegocio,
} from "./socio-negocios-api"
import type {
  ConsultarSociosDeNegocioQuery,
  ExportarSociosDeNegocioQuery,
} from "../tipos/socio-negocio"

export function useEstadoBcSocioDeNegocioQuery() {
  return useQuery({
    queryKey: queryKeys.socioNegocios.estado(),
    queryFn: obtenerEstadoBcSocioDeNegocio,
  })
}

export function useSociosDeNegocioQuery(
  query?: ConsultarSociosDeNegocioQuery
) {
  return useQuery({
    queryKey: queryKeys.socioNegocios.lista(query),
    queryFn: () => consultarSociosDeNegocio(query),
  })
}

export function useSocioDeNegocioQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.socioNegocios.detalle(id),
    queryFn: () => obtenerSocioDeNegocio(id),
    enabled: Boolean(id),
  })
}

export function useExportarSociosDeNegocioQuery(
  query: ExportarSociosDeNegocioQuery,
  enabled = false
) {
  return useQuery({
    queryKey: queryKeys.socioNegocios.exportacion(query),
    queryFn: () => exportarSociosDeNegocio(query),
    enabled,
  })
}

export function useRegistrarSocioDeNegocioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: registrarSocioDeNegocio,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.socioNegocios.listas(),
      })
    },
  })
}

export function useRegistrarClienteDesdeComercialMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: registrarClienteDesdeComercial,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.socioNegocios.listas(),
      })
    },
  })
}

export function useModificarSocioDeNegocioMutation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Parameters<typeof modificarSocioDeNegocio>[1]) =>
      modificarSocioDeNegocio(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.socioNegocios.listas(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.socioNegocios.detalle(id),
      })
    },
  })
}

export function useDarDeBajaSocioDeNegocioMutation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Parameters<typeof darDeBajaSocioDeNegocio>[1]) =>
      darDeBajaSocioDeNegocio(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.socioNegocios.listas(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.socioNegocios.detalle(id),
      })
    },
  })
}
