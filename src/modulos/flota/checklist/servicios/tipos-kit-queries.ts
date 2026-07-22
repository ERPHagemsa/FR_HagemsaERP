"use client";

import { invalidarConsulta, useConsulta } from "@/compartido/api/use-consulta";
import { useMutar } from "@/compartido/api/use-mutar";
import {
  anularTipoKit,
  crearTipoKit,
  editarTipoKit,
  listarTiposKit,
} from "./mantenedores-api";
import type {
  CrearTipoKitPayload,
  EditarTipoKitPayload,
  FiltrosTiposKit,
  TipoKit,
} from "../tipos/mantenedores.tipos";

const CLAVE_TIPOS_KIT = "flota:checklist:tipos-kit";

export function useTiposKitQuery(filtros: FiltrosTiposKit = {}) {
  return useConsulta(
    () => listarTiposKit(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_TIPOS_KIT },
  );
}

export interface OpcionesMutacionTipoKit {
  onSuccess?: () => unknown;
  onError?: (err: unknown) => unknown;
}

export function useCrearTipoKitMutation(opciones: OpcionesMutacionTipoKit = {}) {
  return useMutar<CrearTipoKitPayload, TipoKit>({
    fn: (payload) => crearTipoKit(payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_TIPOS_KIT);
      opciones.onSuccess?.();
    },
    onError: (err) => opciones.onError?.(err),
  });
}

export function useEditarTipoKitMutation(id: number, opciones: OpcionesMutacionTipoKit = {}) {
  return useMutar<EditarTipoKitPayload, TipoKit>({
    fn: (payload) => editarTipoKit(id, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_TIPOS_KIT);
      opciones.onSuccess?.();
    },
    onError: (err) => opciones.onError?.(err),
  });
}

export function useAnularTipoKitMutation(id: number, opciones: OpcionesMutacionTipoKit = {}) {
  return useMutar<void, TipoKit>({
    fn: () => anularTipoKit(id),
    onSuccess: () => {
      invalidarConsulta(CLAVE_TIPOS_KIT);
      opciones.onSuccess?.();
    },
    onError: (err) => opciones.onError?.(err),
  });
}
