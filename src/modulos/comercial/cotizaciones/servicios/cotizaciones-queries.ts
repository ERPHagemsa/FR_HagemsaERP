"use client";

import { useConsulta, useMutar } from "@/compartido/api";

import type {
  FiltrosCatalogosCargoAdicional,
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
  obtenerSugerenciasCarga,
} from "./cotizaciones-api";
import { listarCatalogosCargoAdicional } from "./catalogos-cargo-adicional-api";
import { listarModalidades } from "./modalidades-api";

import {
  CLAVE_CARGOS_ADICIONALES,
  CLAVE_COTIZACION_DETALLE,
  CLAVE_COTIZACIONES,
  CLAVE_MODALIDADES,
} from "../../claves-consulta";

// ---------------------------------------------------------------------------
// Consultas (reads)
// ---------------------------------------------------------------------------

export function useListarCotizaciones(filtros: FiltrosCotizaciones = {}) {
  return useConsulta(
    () => listarCotizaciones(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_COTIZACIONES }
  );
}

export function useConsultarCotizacion(id: string) {
  return useConsulta(() => consultarCotizacion(id), [id], {
    enabled: Boolean(id),
    clave: CLAVE_COTIZACION_DETALLE,
  });
}

// Autocompletado de cargas. Espeja la regla del backend: con <2 chars (tras trim)
// no dispara la query. OJO: useConsulta NO limpia `data` al deshabilitarse, asi que
// el consumidor debe gatear el render del dropdown por `q.trim().length >= 2`.
export function useSugerenciasCarga(q: string, limit = 10) {
  const termino = q.trim();
  return useConsulta(
    () => obtenerSugerenciasCarga(termino, limit),
    [termino, limit],
    { enabled: termino.length >= 2 }
  );
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
    [JSON.stringify(filtros)],
    { clave: CLAVE_MODALIDADES }
  );
}

// ---------------------------------------------------------------------------
// Catalogo de cargos adicionales (lectura, cache unico en el editor)
// ---------------------------------------------------------------------------

export function useListarCatalogosCargoAdicional(
  filtros: FiltrosCatalogosCargoAdicional = {}
) {
  return useConsulta(
    () => listarCatalogosCargoAdicional(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_CARGOS_ADICIONALES }
  );
}
