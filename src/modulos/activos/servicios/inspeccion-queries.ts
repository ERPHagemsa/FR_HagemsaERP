"use client";

import { useConsulta } from "@/compartido/api";

import {
  obtenerCandidatosInspeccion,
  obtenerInspeccionPorId,
  obtenerInspecciones,
  obtenerSnapshotDetalleInspeccion,
} from "./inspeccion-api";
import type { CandidatoInspeccionFiltro } from "../tipos/inspeccion.tipos";

export function useInspeccionesQuery() {
  return useConsulta(obtenerInspecciones, []);
}

export function useInspeccionQuery(id: number) {
  return useConsulta(() => obtenerInspeccionPorId(id), [id], {
    enabled: Boolean(id),
  });
}

export function useCandidatosInspeccionQuery(
  inspeccionId: number,
  filtro: CandidatoInspeccionFiltro,
  opciones: { enabled?: boolean } = {}
) {
  return useConsulta(
    () => obtenerCandidatosInspeccion(inspeccionId, filtro),
    [inspeccionId, filtro.q, filtro.etiqueta],
    { enabled: opciones.enabled ?? Boolean(inspeccionId) }
  );
}

// Snapshot congelado + datos operativos de un detalle, bajo demanda: solo se
// descarga al abrir la ficha "Inspeccionar".
export function useSnapshotDetalleInspeccionQuery(
  inspeccionId: number,
  detalleId: number | null
) {
  return useConsulta(
    () => obtenerSnapshotDetalleInspeccion(inspeccionId, detalleId ?? 0),
    [inspeccionId, detalleId],
    { enabled: Boolean(inspeccionId) && Boolean(detalleId) }
  );
}
