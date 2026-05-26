"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/compartido/api";
import type {
  ActualizarActivoPayload,
  CrearActivoPayload,
  CrearDocumentoActivoPayload,
  CrearImagenActivoPayload,
  CrearTanqueActivoPayload,
  EstadoActivo,
} from "../tipos/activo.tipos";
import {
  actualizarActivo,
  cambiarEstadoActivo,
  crearActivo,
  crearDocumentoPorCodigo,
  crearImagenPorCodigo,
  crearTanquePorCodigo,
  eliminarDocumentoPorCodigo,
  eliminarImagenPorCodigo,
  eliminarTanquePorCodigo,
  obtenerActivoPorCodigo,
  obtenerActivos,
  obtenerDocumentosPorCodigo,
  obtenerImagenesPorCodigo,
  obtenerTanquesPorCodigo,
  siniestrarActivo,
} from "./activos-api";

export function useActivosQuery() {
  return useQuery({
    queryKey: queryKeys.activos.lista(),
    queryFn: obtenerActivos,
  });
}

export function useActivoQuery(codigo: string) {
  return useQuery({
    queryKey: queryKeys.activos.detalle(codigo),
    queryFn: () => obtenerActivoPorCodigo(codigo),
    enabled: Boolean(codigo),
  });
}

export function useImagenesActivoQuery(codigo: string) {
  return useQuery({
    queryKey: queryKeys.activos.imagenes(codigo),
    queryFn: () => obtenerImagenesPorCodigo(codigo),
    enabled: Boolean(codigo),
  });
}

export function useDocumentosActivoQuery(codigo: string) {
  return useQuery({
    queryKey: queryKeys.activos.documentos(codigo),
    queryFn: () => obtenerDocumentosPorCodigo(codigo),
    enabled: Boolean(codigo),
  });
}

export function useTanquesActivoQuery(codigo: string) {
  return useQuery({
    queryKey: queryKeys.activos.tanques(codigo),
    queryFn: () => obtenerTanquesPorCodigo(codigo),
    enabled: Boolean(codigo),
  });
}

export function useCrearActivoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CrearActivoPayload) => crearActivo(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.activos.all }),
  });
}

export function useActualizarActivoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ActualizarActivoPayload;
    }) => actualizarActivo(id, payload),
    onSuccess: (activo) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.activos.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.activos.detalle(activo.codigo),
      });
    },
  });
}

export function useCambiarEstadoActivoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: {
        estadoActivo: EstadoActivo;
        motivo?: string;
        usuario?: string;
      };
    }) => cambiarEstadoActivo(id, payload),
    onSuccess: (activo) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.activos.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.activos.detalle(activo.codigo),
      });
    },
  });
}

export function useSiniestrarActivoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: {
        observacion?: string;
      };
    }) => siniestrarActivo(id, payload),
    onSuccess: (activo) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.activos.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.activos.detalle(activo.codigo),
      });
    },
  });
}

export function useCrearDocumentoActivoMutation(codigo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CrearDocumentoActivoPayload) =>
      crearDocumentoPorCodigo(codigo, payload),
    onSuccess: () => invalidateActivoChildren(queryClient, codigo),
  });
}

export function useEliminarDocumentoActivoMutation(codigo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentoId: number) =>
      eliminarDocumentoPorCodigo(codigo, documentoId),
    onSuccess: () => invalidateActivoChildren(queryClient, codigo),
  });
}

export function useCrearImagenActivoMutation(codigo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CrearImagenActivoPayload) =>
      crearImagenPorCodigo(codigo, payload),
    onSuccess: () => invalidateActivoChildren(queryClient, codigo),
  });
}

export function useEliminarImagenActivoMutation(codigo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imagenId: number) => eliminarImagenPorCodigo(codigo, imagenId),
    onSuccess: () => invalidateActivoChildren(queryClient, codigo),
  });
}

export function useCrearTanqueActivoMutation(codigo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CrearTanqueActivoPayload) =>
      crearTanquePorCodigo(codigo, payload),
    onSuccess: () => invalidateActivoChildren(queryClient, codigo),
  });
}

export function useEliminarTanqueActivoMutation(codigo: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tanqueId: number) => eliminarTanquePorCodigo(codigo, tanqueId),
    onSuccess: () => invalidateActivoChildren(queryClient, codigo),
  });
}

function invalidateActivoChildren(
  queryClient: ReturnType<typeof useQueryClient>,
  codigo: string
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.activos.all });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.activos.detalle(codigo),
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.activos.documentos(codigo),
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.activos.imagenes(codigo),
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.activos.tanques(codigo),
  });
}
