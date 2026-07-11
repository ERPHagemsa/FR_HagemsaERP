"use client";

import { invalidarConsulta, useConsulta } from "@/compartido/api/use-consulta";
import { useMutar } from "@/compartido/api/use-mutar";
import {
  asignarEtiqueta,
  generarEtiquetas,
  obtenerEtiquetaPorId,
  obtenerEtiquetas,
} from "./etiquetas-api";
import type {
  AsignarEtiquetaPayload,
  Etiqueta,
  FiltrosEtiquetas,
  GenerarEtiquetasPayload,
} from "../tipos/etiquetas.tipos";

const CLAVE_ETIQUETAS = "activos:etiquetas";

export function useEtiquetasQuery(filtros?: FiltrosEtiquetas) {
  return useConsulta(() => obtenerEtiquetas(filtros), [JSON.stringify(filtros ?? {})], {
    clave: CLAVE_ETIQUETAS,
  });
}

export function useEtiquetaQuery(id: number | null) {
  return useConsulta(() => obtenerEtiquetaPorId(id as number), [id], {
    enabled: id !== null,
    clave: CLAVE_ETIQUETAS,
  });
}

export interface OpcionesMutacionEtiquetas {
  onSuccess?: (data: Etiqueta[]) => unknown;
  onError?: (err: unknown) => unknown;
}

export function useGenerarEtiquetasMutation(opciones: OpcionesMutacionEtiquetas = {}) {
  return useMutar<GenerarEtiquetasPayload, Etiqueta[]>({
    fn: (payload) => generarEtiquetas(payload),
    onSuccess: (data) => {
      invalidarConsulta(CLAVE_ETIQUETAS);
      opciones.onSuccess?.(data);
    },
    onError: (err) => opciones.onError?.(err),
  });
}

export function useAsignarEtiquetaMutation(opciones: {
  onSuccess?: (data: Etiqueta) => unknown;
  onError?: (err: unknown) => unknown;
} = {}) {
  return useMutar<{ id: number; payload: AsignarEtiquetaPayload }, Etiqueta>({
    fn: ({ id, payload }) => asignarEtiqueta(id, payload),
    onSuccess: (data) => {
      invalidarConsulta(CLAVE_ETIQUETAS);
      opciones.onSuccess?.(data);
    },
    onError: (err) => opciones.onError?.(err),
  });
}
