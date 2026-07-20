"use client";

import { invalidarConsulta, useConsulta } from "@/compartido/api/use-consulta";
import { useMutar } from "@/compartido/api/use-mutar";
import {
  anularInspeccion,
  autoguardarRespuestas,
  cerrarInspeccion,
  iniciarInspeccion,
  listarInspecciones,
  obtenerInspeccion,
  registrarRespuestas,
} from "./inspeccion-api";
import type {
  FiltrosInspecciones,
  IniciarInspeccionPayload,
  Inspeccion,
  RegistrarRespuestasPayload,
} from "../tipos/inspeccion.tipos";

const CLAVE_INSPECCIONES = "flota:checklist:inspecciones";

export function useInspeccionesQuery(filtros: FiltrosInspecciones = {}) {
  return useConsulta(
    () => listarInspecciones(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_INSPECCIONES },
  );
}

export function useInspeccionQuery(id: number | null) {
  return useConsulta(
    () => (id ? obtenerInspeccion(id) : Promise.resolve(null)),
    [id ?? 0],
    { clave: id ? `${CLAVE_INSPECCIONES}:${id}` : CLAVE_INSPECCIONES, enabled: Boolean(id) },
  );
}

export interface OpcionesMutacionInspeccion {
  onSuccess?: (inspeccion: Inspeccion) => unknown;
  onError?: (err: unknown) => unknown;
}

export function useIniciarInspeccionMutation(
  opciones: OpcionesMutacionInspeccion = {},
) {
  return useMutar<IniciarInspeccionPayload, Inspeccion>({
    fn: (payload) => iniciarInspeccion(payload),
    onSuccess: (inspeccion) => {
      invalidarConsulta(CLAVE_INSPECCIONES);
      opciones.onSuccess?.(inspeccion);
    },
    onError: (err) => opciones.onError?.(err),
  });
}

export function useAnularInspeccionMutation(
  id: number,
  opciones: OpcionesMutacionInspeccion = {},
) {
  return useMutar<void, Inspeccion>({
    fn: () => anularInspeccion(id),
    onSuccess: (inspeccion) => {
      invalidarConsulta(CLAVE_INSPECCIONES);
      opciones.onSuccess?.(inspeccion);
    },
    onError: (err) => opciones.onError?.(err),
  });
}

// Autoguardado por debounce: NO invalida la consulta (evitaría refetch mientras
// el usuario sigue escribiendo). El componente de captura fusiona la respuesta
// del servidor en su propio estado local.
export function useAutoguardarRespuestasMutation(
  id: number,
  opciones: OpcionesMutacionInspeccion = {},
) {
  return useMutar<RegistrarRespuestasPayload, Inspeccion>({
    fn: (payload) => autoguardarRespuestas(id, payload),
    onSuccess: (inspeccion) => opciones.onSuccess?.(inspeccion),
    onError: (err) => opciones.onError?.(err),
  });
}

export function useRegistrarRespuestasMutation(
  id: number,
  opciones: OpcionesMutacionInspeccion = {},
) {
  return useMutar<RegistrarRespuestasPayload, Inspeccion>({
    fn: (payload) => registrarRespuestas(id, payload),
    onSuccess: (inspeccion) => opciones.onSuccess?.(inspeccion),
    onError: (err) => opciones.onError?.(err),
  });
}

export function useCerrarInspeccionMutation(
  id: number,
  opciones: OpcionesMutacionInspeccion = {},
) {
  return useMutar<void, Inspeccion>({
    fn: () => cerrarInspeccion(id),
    onSuccess: (inspeccion) => {
      invalidarConsulta(`${CLAVE_INSPECCIONES}:${id}`);
      invalidarConsulta(CLAVE_INSPECCIONES);
      opciones.onSuccess?.(inspeccion);
    },
    onError: (err) => opciones.onError?.(err),
  });
}
