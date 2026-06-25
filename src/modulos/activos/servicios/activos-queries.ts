"use client";

import { useConsulta, useMutar } from "@/compartido/api";
import type {
  ActualizarActivoPayload,
  CrearActivoPayload,
  CrearDocumentoActivoPayload,
  CrearImagenActivoPayload,
  CrearTanqueActivoPayload,
  EstadoActivo,
  EstadoRegistro,
} from "../tipos/activo.tipos";
import {
  actualizarActivo,
  cambiarEstadoActivo,
  cambiarEstadoRegistro,
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
  quitarCoberturaDocumentoCompartidoPorCodigo,
  siniestrarActivo,
} from "./activos-api";

export function useActivosQuery() {
  return useConsulta(obtenerActivos, []);
}

export function useActivoQuery(codigo: string) {
  return useConsulta(() => obtenerActivoPorCodigo(codigo), [codigo], {
    enabled: Boolean(codigo),
  });
}

export function useImagenesActivoQuery(codigo: string) {
  return useConsulta(() => obtenerImagenesPorCodigo(codigo), [codigo], {
    enabled: Boolean(codigo),
  });
}

export function useDocumentosActivoQuery(codigo: string) {
  return useConsulta(() => obtenerDocumentosPorCodigo(codigo), [codigo], {
    enabled: Boolean(codigo),
  });
}

export function useTanquesActivoQuery(codigo: string) {
  return useConsulta(() => obtenerTanquesPorCodigo(codigo), [codigo], {
    enabled: Boolean(codigo),
  });
}

export function useCrearActivoMutation() {
  return useMutar<CrearActivoPayload, Awaited<ReturnType<typeof crearActivo>>>({
    fn: crearActivo,
  });
}

export function useActualizarActivoMutation() {
  return useMutar<
    { id: number; payload: ActualizarActivoPayload },
    Awaited<ReturnType<typeof actualizarActivo>>
  >({
    fn: ({ id, payload }) => actualizarActivo(id, payload),
  });
}

export function useCambiarEstadoActivoMutation() {
  return useMutar<
    {
      id: number;
      payload: {
        estadoActivo: EstadoActivo;
        motivo?: string;
        usuario?: string;
      };
    },
    Awaited<ReturnType<typeof cambiarEstadoActivo>>
  >({
    fn: ({ id, payload }) => cambiarEstadoActivo(id, payload),
  });
}

export function useCambiarEstadoRegistroMutation() {
  return useMutar<
    {
      id: number;
      payload: {
        estadoRegistro: EstadoRegistro;
        motivo?: string;
        usuario?: string;
      };
    },
    Awaited<ReturnType<typeof cambiarEstadoRegistro>>
  >({
    fn: ({ id, payload }) => cambiarEstadoRegistro(id, payload),
  });
}

export function useSiniestrarActivoMutation() {
  return useMutar<
    {
      id: number;
      payload: {
        observacion?: string;
      };
    },
    Awaited<ReturnType<typeof siniestrarActivo>>
  >({
    fn: ({ id, payload }) => siniestrarActivo(id, payload),
  });
}

export function useCrearDocumentoActivoMutation(codigo: string) {
  return useMutar<
    CrearDocumentoActivoPayload,
    Awaited<ReturnType<typeof crearDocumentoPorCodigo>>
  >({
    fn: (payload) => crearDocumentoPorCodigo(codigo, payload),
  });
}

export function useEliminarDocumentoActivoMutation(codigo: string) {
  return useMutar<number, Awaited<ReturnType<typeof eliminarDocumentoPorCodigo>>>(
    {
      fn: (documentoId) => eliminarDocumentoPorCodigo(codigo, documentoId),
    }
  );
}

export function useQuitarCoberturaDocumentoCompartidoMutation(codigo: string) {
  return useMutar<
    number,
    Awaited<ReturnType<typeof quitarCoberturaDocumentoCompartidoPorCodigo>>
  >({
    fn: (documentoCompartidoId) =>
      quitarCoberturaDocumentoCompartidoPorCodigo(codigo, documentoCompartidoId),
  });
}

export function useCrearImagenActivoMutation(codigo: string) {
  return useMutar<
    CrearImagenActivoPayload,
    Awaited<ReturnType<typeof crearImagenPorCodigo>>
  >({
    fn: (payload) => crearImagenPorCodigo(codigo, payload),
  });
}

export function useEliminarImagenActivoMutation(codigo: string) {
  return useMutar<number, Awaited<ReturnType<typeof eliminarImagenPorCodigo>>>({
    fn: (imagenId) => eliminarImagenPorCodigo(codigo, imagenId),
  });
}

export function useCrearTanqueActivoMutation(codigo: string) {
  return useMutar<
    CrearTanqueActivoPayload,
    Awaited<ReturnType<typeof crearTanquePorCodigo>>
  >({
    fn: (payload) => crearTanquePorCodigo(codigo, payload),
  });
}

export function useEliminarTanqueActivoMutation(codigo: string) {
  return useMutar<number, Awaited<ReturnType<typeof eliminarTanquePorCodigo>>>({
    fn: (tanqueId) => eliminarTanquePorCodigo(codigo, tanqueId),
  });
}
