"use client";

import { useConsulta, useMutar } from "@/compartido/api";

import type {
  FiltrosCotizaciones,
  FiltrosModalidades,
  PayloadBorrador,
  PayloadEnviar,
  PayloadNuevaVersion,
  PayloadPerdida,
} from "../tipos/cotizaciones.tipos";
import {
  actualizarBorrador,
  cancelarCotizacion,
  consultarCotizacion,
  enviarCotizacion,
  listarCotizaciones,
  marcarGanada,
  marcarPerdida,
  nuevaVersion,
} from "./cotizaciones-api";
import { listarModalidades } from "./modalidades-api";

// ---------------------------------------------------------------------------
// Consultas (reads)
// ---------------------------------------------------------------------------

export function useListarCotizaciones(filtros: FiltrosCotizaciones = {}) {
  return useConsulta(
    () => listarCotizaciones(filtros),
    [JSON.stringify(filtros)]
  );
}

export function useConsultarCotizacion(id: string) {
  return useConsulta(() => consultarCotizacion(id), [id], {
    enabled: Boolean(id),
  });
}

// ---------------------------------------------------------------------------
// Mutaciones (writes)
// ---------------------------------------------------------------------------

export function useActualizarBorradorMutation(id: string) {
  return useMutar<
    PayloadBorrador,
    Awaited<ReturnType<typeof actualizarBorrador>>
  >({
    fn: (payload) => actualizarBorrador(id, payload),
  });
}

export function useEnviarCotizacionMutation(id: string) {
  return useMutar<
    PayloadEnviar,
    Awaited<ReturnType<typeof enviarCotizacion>>
  >({
    fn: (payload) => enviarCotizacion(id, payload),
  });
}

export function useNuevaVersionMutation(id: string) {
  return useMutar<
    PayloadNuevaVersion,
    Awaited<ReturnType<typeof nuevaVersion>>
  >({
    fn: (payload) => nuevaVersion(id, payload),
  });
}

export function useMarcarGanadaMutation(id: string) {
  return useMutar<undefined, Awaited<ReturnType<typeof marcarGanada>>>({
    fn: () => marcarGanada(id),
  });
}

export function useMarcarPerdidaMutation(id: string) {
  return useMutar<
    PayloadPerdida,
    Awaited<ReturnType<typeof marcarPerdida>>
  >({
    fn: (payload) => marcarPerdida(id, payload),
  });
}

export function useCancelarCotizacionMutation(id: string) {
  return useMutar<undefined, Awaited<ReturnType<typeof cancelarCotizacion>>>({
    fn: () => cancelarCotizacion(id),
  });
}

// ---------------------------------------------------------------------------
// Modalidades (catalogo de lectura)
// ---------------------------------------------------------------------------

export function useListarModalidades(filtros: FiltrosModalidades = {}) {
  return useConsulta(
    () => listarModalidades(filtros),
    [JSON.stringify(filtros)]
  );
}
