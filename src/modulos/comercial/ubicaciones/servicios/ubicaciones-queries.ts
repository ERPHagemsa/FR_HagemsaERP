"use client";

import { invalidarConsulta, useConsulta, useMutar } from "@/compartido/api";

import type {
  EstadoUbicacionTemporal,
  PayloadCompletarUbicacion,
  UbicacionTemporal,
} from "../tipos/ubicaciones.tipos";
import {
  completarUbicacionTemporal,
  listarUbicaciones,
  listarUbicacionesTemporales,
} from "./ubicaciones-api";
import {
  CLAVE_COTIZACION_DETALLE,
  CLAVE_UBICACIONES_TEMPORALES,
} from "../../claves-consulta";

// ---------------------------------------------------------------------------
// Consultas (reads)
// ---------------------------------------------------------------------------

// Ubicaciones temporales de una cotización (bandeja "por completar" = PENDIENTE).
export function useUbicacionesTemporalesQuery(
  idCotizacion: string,
  estado?: EstadoUbicacionTemporal
) {
  return useConsulta(
    () => listarUbicacionesTemporales(idCotizacion, estado),
    [idCotizacion, estado ?? ""],
    { clave: CLAVE_UBICACIONES_TEMPORALES, enabled: Boolean(idCotizacion) }
  );
}

// Búsqueda en la MAESTRA local (réplica confirmada de BC-14) para el selector de
// origen/destino de secciones. Con <2 chars no dispara (igual que sugerencias de
// carga). useConsulta NO limpia `data` al deshabilitarse → el consumidor gatea el
// render del dropdown por `length >= 2`.
export function useBuscarUbicacionesMaestra(q: string) {
  const termino = q.trim();
  return useConsulta(() => listarUbicaciones(termino), [termino], {
    enabled: termino.length >= 2,
  });
}

// ---------------------------------------------------------------------------
// Mutaciones (writes)
// ---------------------------------------------------------------------------

// Completa una ubicación temporal (con dedup ya resuelto en el payload).
// Invalida la bandeja y el detalle de la cotización (las líneas resuelven su
// nombre de ubicación desde la temporal/maestra).
export function useCompletarUbicacionMutation(idTemporal: string) {
  return useMutar<PayloadCompletarUbicacion, UbicacionTemporal>({
    fn: (payload) => completarUbicacionTemporal(idTemporal, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_UBICACIONES_TEMPORALES);
      invalidarConsulta(CLAVE_COTIZACION_DETALLE);
    },
  });
}
