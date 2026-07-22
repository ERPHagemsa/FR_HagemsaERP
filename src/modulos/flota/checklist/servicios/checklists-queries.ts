"use client";

import { invalidarConsulta, useConsulta } from "@/compartido/api/use-consulta";
import { useMutar } from "@/compartido/api/use-mutar";
import {
  anularChecklist,
  autoguardarRespuestas,
  cerrarChecklist,
  iniciarChecklist,
  listarChecklists,
  obtenerChecklist,
  registrarRespuestas,
} from "./checklist-api";
import type {
  FiltrosChecklists,
  IniciarChecklistPayload,
  Checklist,
  RegistrarRespuestasPayload,
} from "../tipos/checklist.tipos";

const CLAVE_CHECKLISTES = "flota:checklist:checklists";

export function useChecklistsQuery(filtros: FiltrosChecklists = {}) {
  return useConsulta(
    () => listarChecklists(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_CHECKLISTES },
  );
}

export function useChecklistQuery(id: number | null) {
  return useConsulta(
    () => (id ? obtenerChecklist(id) : Promise.resolve(null)),
    [id ?? 0],
    { clave: id ? `${CLAVE_CHECKLISTES}:${id}` : CLAVE_CHECKLISTES, enabled: Boolean(id) },
  );
}

export interface OpcionesMutacionChecklist {
  onSuccess?: (checklist: Checklist) => unknown;
  onError?: (err: unknown) => unknown;
}

export function useIniciarChecklistMutation(
  opciones: OpcionesMutacionChecklist = {},
) {
  return useMutar<IniciarChecklistPayload, Checklist>({
    fn: (payload) => iniciarChecklist(payload),
    onSuccess: (checklist) => {
      invalidarConsulta(CLAVE_CHECKLISTES);
      opciones.onSuccess?.(checklist);
    },
    onError: (err) => opciones.onError?.(err),
  });
}

export function useAnularChecklistMutation(
  id: number,
  opciones: OpcionesMutacionChecklist = {},
) {
  return useMutar<void, Checklist>({
    fn: () => anularChecklist(id),
    onSuccess: (checklist) => {
      invalidarConsulta(CLAVE_CHECKLISTES);
      opciones.onSuccess?.(checklist);
    },
    onError: (err) => opciones.onError?.(err),
  });
}

// Autoguardado por debounce: NO invalida la consulta (evitaría refetch mientras
// el usuario sigue escribiendo). El componente de captura fusiona la respuesta
// del servidor en su propio estado local.
export function useAutoguardarRespuestasMutation(
  id: number,
  opciones: OpcionesMutacionChecklist = {},
) {
  return useMutar<RegistrarRespuestasPayload, Checklist>({
    fn: (payload) => autoguardarRespuestas(id, payload),
    onSuccess: (checklist) => opciones.onSuccess?.(checklist),
    onError: (err) => opciones.onError?.(err),
  });
}

export function useRegistrarRespuestasMutation(
  id: number,
  opciones: OpcionesMutacionChecklist = {},
) {
  return useMutar<RegistrarRespuestasPayload, Checklist>({
    fn: (payload) => registrarRespuestas(id, payload),
    onSuccess: (checklist) => opciones.onSuccess?.(checklist),
    onError: (err) => opciones.onError?.(err),
  });
}

export function useCerrarChecklistMutation(
  id: number,
  opciones: OpcionesMutacionChecklist = {},
) {
  return useMutar<void, Checklist>({
    fn: () => cerrarChecklist(id),
    onSuccess: (checklist) => {
      invalidarConsulta(`${CLAVE_CHECKLISTES}:${id}`);
      invalidarConsulta(CLAVE_CHECKLISTES);
      opciones.onSuccess?.(checklist);
    },
    onError: (err) => opciones.onError?.(err),
  });
}
