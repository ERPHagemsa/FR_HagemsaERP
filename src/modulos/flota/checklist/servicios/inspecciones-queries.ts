"use client";

import { invalidarConsulta, useConsulta } from "@/compartido/api/use-consulta";
import { useMutar } from "@/compartido/api/use-mutar";
import {
  anularInspeccion,
  iniciarInspeccion,
  listarInspecciones,
  obtenerInspeccion,
} from "./inspeccion-api";
import type {
  FiltrosInspecciones,
  IniciarInspeccionPayload,
  Inspeccion,
} from "../tipos/inspeccion.tipos";

const CLAVE_INSPECCIONES = "flota:checklist:inspecciones";

export function useInspeccionesQuery(filtros: FiltrosInspecciones = {}) {
  return useConsulta(
    () => listarInspecciones(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_INSPECCIONES },
  );
}

export function useInspeccionQuery(id: string | null) {
  return useConsulta(
    () => (id ? obtenerInspeccion(id) : Promise.resolve(null)),
    [id ?? ""],
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
  id: string,
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
