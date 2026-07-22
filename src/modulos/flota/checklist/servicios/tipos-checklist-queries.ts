"use client";

import { invalidarConsulta, useConsulta } from "@/compartido/api/use-consulta";
import { useMutar } from "@/compartido/api/use-mutar";
import {
  anularTipoChecklist,
  crearTipoChecklist,
  editarTipoChecklist,
  listarTiposChecklist,
} from "./mantenedores-api";
import type {
  CrearTipoChecklistPayload,
  EditarTipoChecklistPayload,
  FiltrosTiposChecklist,
  TipoChecklist,
} from "../tipos/mantenedores.tipos";

const CLAVE_TIPOS_CHECKLIST = "flota:checklist:tipos-checklist";

export function useTiposChecklistQuery(filtros: FiltrosTiposChecklist = {}) {
  return useConsulta(
    () => listarTiposChecklist(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_TIPOS_CHECKLIST },
  );
}

export interface OpcionesMutacionTipoChecklist {
  onSuccess?: () => unknown;
  onError?: (err: unknown) => unknown;
}

export function useCrearTipoChecklistMutation(
  opciones: OpcionesMutacionTipoChecklist = {},
) {
  return useMutar<CrearTipoChecklistPayload, TipoChecklist>({
    fn: (payload) => crearTipoChecklist(payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_TIPOS_CHECKLIST);
      opciones.onSuccess?.();
    },
    onError: (err) => opciones.onError?.(err),
  });
}

export function useEditarTipoChecklistMutation(
  id: number,
  opciones: OpcionesMutacionTipoChecklist = {},
) {
  return useMutar<EditarTipoChecklistPayload, TipoChecklist>({
    fn: (payload) => editarTipoChecklist(id, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_TIPOS_CHECKLIST);
      opciones.onSuccess?.();
    },
    onError: (err) => opciones.onError?.(err),
  });
}

export function useAnularTipoChecklistMutation(
  id: number,
  opciones: OpcionesMutacionTipoChecklist = {},
) {
  return useMutar<void, TipoChecklist>({
    fn: () => anularTipoChecklist(id),
    onSuccess: () => {
      invalidarConsulta(CLAVE_TIPOS_CHECKLIST);
      opciones.onSuccess?.();
    },
    onError: (err) => opciones.onError?.(err),
  });
}
