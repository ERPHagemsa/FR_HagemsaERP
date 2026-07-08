"use client";

import { invalidarConsulta, useConsulta, useMutar } from "@/compartido/api";

import type {
  EstadoUbicacionTemporal,
  PayloadCompletarUbicacion,
  UbicacionTemporal,
} from "../tipos/ubicaciones.tipos";
import {
  completarUbicacionTemporal,
  corregirUbicacionTemporal,
  listarUbicaciones,
  listarUbicacionesTemporales,
} from "./ubicaciones-api";
import {
  CLAVE_COTIZACION_DETALLE,
  CLAVE_UBICACIONES_MAESTRA,
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

// Listado de la MAESTRA local para la página de ubicaciones. Siempre habilitado:
// con búsqueda vacía trae todo (el backend no pagina este endpoint).
export function useUbicacionesQuery(busqueda?: string) {
  const termino = busqueda?.trim() ?? "";
  return useConsulta(
    () => listarUbicaciones(termino || undefined),
    [termino],
    { clave: CLAVE_UBICACIONES_MAESTRA }
  );
}

// Una ubicación exacta del maestro por nombre. Sirve para enriquecer el panel de
// una cotización GANADA: los origen/destino que resolvieron al maestro solo
// llevan el nombre en la ruta, así que se recupera el registro completo. Reusa
// la búsqueda `contains` y filtra el match exacto (insensible a mayúsculas).
export function useUbicacionMaestraPorNombre(nombre: string) {
  const termino = nombre.trim();
  const consulta = useConsulta(() => listarUbicaciones(termino), [termino], {
    enabled: termino.length >= 2,
  });
  const ubicacion =
    consulta.data?.find(
      (u) => u.nombre.trim().toLowerCase() === termino.toLowerCase()
    ) ?? null;
  return { ...consulta, ubicacion };
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

// Corrige una ubicación ya sincronizada (re-viaja a BC-14 como actualización).
// Invalida la bandeja y el detalle igual que completar.
export function useCorregirUbicacionMutation(idTemporal: string) {
  return useMutar<PayloadCompletarUbicacion, UbicacionTemporal>({
    fn: (payload) => corregirUbicacionTemporal(idTemporal, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_UBICACIONES_TEMPORALES);
      invalidarConsulta(CLAVE_COTIZACION_DETALLE);
    },
  });
}
