"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/compartido/api"

import {
  crearAbastecimiento,
  crearSolicitudDesdeManifiesto,
  listarAbastecimientos,
  listarManifiestos,
  listarSolicitudes,
  obtenerHealthCombustible,
} from "./combustible-api"

export function useHealthCombustibleQuery() {
  return useQuery({
    queryKey: queryKeys.combustible.health(),
    queryFn: obtenerHealthCombustible,
  })
}

export function useManifiestosQuery() {
  return useQuery({
    queryKey: queryKeys.combustible.manifiestos(),
    queryFn: listarManifiestos,
  })
}

export function useSolicitudesCombustibleQuery() {
  return useQuery({
    queryKey: queryKeys.combustible.solicitudes(),
    queryFn: listarSolicitudes,
  })
}

export function useAbastecimientosCombustibleQuery() {
  return useQuery({
    queryKey: queryKeys.combustible.abastecimientos(),
    queryFn: listarAbastecimientos,
  })
}

export function useCrearSolicitudCombustibleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: crearSolicitudDesdeManifiesto,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.combustible.solicitudes(),
      })
    },
  })
}

export function useCrearAbastecimientoCombustibleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: crearAbastecimiento,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.combustible.abastecimientos(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.combustible.solicitudes(),
      })
    },
  })
}
