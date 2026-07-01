"use client";

import { invalidarConsulta, useConsulta } from "@/compartido/api/use-consulta";
import { useMutar } from "@/compartido/api/use-mutar";
import {
  anularColorRotulacion,
  crearColorRotulacion,
  editarColorRotulacion,
  listarColoresRotulacion,
} from "./checklist-api";
import type {
  ColorRotulacion,
  CrearColorRotulacionPayload,
  EditarColorRotulacionPayload,
  FiltrosColoresRotulacion,
} from "../tipos/checklist.tipos";

const CLAVE_COLORES_ROTULACION = "flota:checklist:colores-rotulacion";

export function useColoresRotulacionQuery(filtros: FiltrosColoresRotulacion = {}) {
  return useConsulta(
    () => listarColoresRotulacion(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_COLORES_ROTULACION },
  );
}

export interface OpcionesMutacionColorRotulacion {
  onSuccess?: () => unknown;
  onError?: (err: unknown) => unknown;
}

export function useCrearColorRotulacionMutation(
  opciones: OpcionesMutacionColorRotulacion = {},
) {
  return useMutar<CrearColorRotulacionPayload, ColorRotulacion>({
    fn: (payload) => crearColorRotulacion(payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_COLORES_ROTULACION);
      opciones.onSuccess?.();
    },
    onError: (err) => opciones.onError?.(err),
  });
}

export function useEditarColorRotulacionMutation(
  id: string,
  opciones: OpcionesMutacionColorRotulacion = {},
) {
  return useMutar<EditarColorRotulacionPayload, ColorRotulacion>({
    fn: (payload) => editarColorRotulacion(id, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_COLORES_ROTULACION);
      opciones.onSuccess?.();
    },
    onError: (err) => opciones.onError?.(err),
  });
}

export function useAnularColorRotulacionMutation(
  id: string,
  opciones: OpcionesMutacionColorRotulacion = {},
) {
  return useMutar<void, ColorRotulacion>({
    fn: () => anularColorRotulacion(id),
    onSuccess: () => {
      invalidarConsulta(CLAVE_COLORES_ROTULACION);
      opciones.onSuccess?.();
    },
    onError: (err) => opciones.onError?.(err),
  });
}
