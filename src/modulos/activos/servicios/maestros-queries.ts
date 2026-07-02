"use client";

import { invalidarConsulta, useConsulta } from "@/compartido/api/use-consulta";
import { useMutar } from "@/compartido/api/use-mutar";
import {
  actualizarValorCatalogo,
  cambiarEstadoRegistroValorCatalogo,
  crearValorCatalogo,
  obtenerHistorialCatalogo,
  obtenerValoresCatalogo,
} from "./maestros-api";
import type {
  ActualizarValorCatalogoPayload,
  CambiarEstadoRegistroValorCatalogoPayload,
  CrearValorCatalogoPayload,
  FiltrosHistorialCatalogo,
  TipoCatalogoMaestro,
  ValorCatalogo,
} from "../tipos/maestros.tipos";

function claveCatalogo(tipoCatalogo: TipoCatalogoMaestro) {
  return `activos:maestros:${tipoCatalogo}`;
}

export function useValoresCatalogoQuery(
  tipoCatalogo: TipoCatalogoMaestro,
  estadoRegistro?: boolean,
  claseVehiculoReferenciaId?: number,
  opciones: { enabled?: boolean } = {}
) {
  return useConsulta(
    () =>
      obtenerValoresCatalogo(tipoCatalogo, estadoRegistro, claseVehiculoReferenciaId),
    [tipoCatalogo, estadoRegistro, claseVehiculoReferenciaId],
    { clave: claveCatalogo(tipoCatalogo), enabled: opciones.enabled }
  );
}

export function useHistorialCatalogoQuery(filtros?: FiltrosHistorialCatalogo) {
  return useConsulta(
    () => obtenerHistorialCatalogo(filtros),
    [JSON.stringify(filtros ?? {})]
  );
}

export interface OpcionesMutacionCatalogo {
  onSuccess?: () => unknown;
  onError?: (err: unknown) => unknown;
}

export function useCrearValorCatalogoMutation(
  tipoCatalogo: TipoCatalogoMaestro,
  opciones: OpcionesMutacionCatalogo = {}
) {
  return useMutar<CrearValorCatalogoPayload, ValorCatalogo>({
    fn: (payload) => crearValorCatalogo(tipoCatalogo, payload),
    onSuccess: () => {
      invalidarConsulta(claveCatalogo(tipoCatalogo));
      opciones.onSuccess?.();
    },
    onError: (err) => opciones.onError?.(err),
  });
}

export function useActualizarValorCatalogoMutation(
  tipoCatalogo: TipoCatalogoMaestro,
  opciones: OpcionesMutacionCatalogo = {}
) {
  return useMutar<
    { id: number; payload: ActualizarValorCatalogoPayload },
    ValorCatalogo
  >({
    fn: ({ id, payload }) => actualizarValorCatalogo(tipoCatalogo, id, payload),
    onSuccess: () => {
      invalidarConsulta(claveCatalogo(tipoCatalogo));
      opciones.onSuccess?.();
    },
    onError: (err) => opciones.onError?.(err),
  });
}

export function useCambiarEstadoRegistroValorCatalogoMutation(
  tipoCatalogo: TipoCatalogoMaestro,
  opciones: OpcionesMutacionCatalogo = {}
) {
  return useMutar<
    { id: number; payload: CambiarEstadoRegistroValorCatalogoPayload },
    ValorCatalogo
  >({
    fn: ({ id, payload }) =>
      cambiarEstadoRegistroValorCatalogo(tipoCatalogo, id, payload),
    onSuccess: () => {
      invalidarConsulta(claveCatalogo(tipoCatalogo));
      opciones.onSuccess?.();
    },
    onError: (err) => opciones.onError?.(err),
  });
}
