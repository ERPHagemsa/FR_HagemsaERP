"use client";

import { useConsulta, useMutar } from "@/compartido/api";

import type {
  PayloadBorrador,
  PayloadRegistrarSC,
} from "../../cotizaciones/tipos/cotizaciones.tipos";
import type {
  FiltrosSolicitudesCliente,
  PayloadDescartarSC,
} from "../tipos/solicitud-cliente.tipos";

import {
  agregarCotizacion,
  consultarSolicitudCliente,
  descartarSolicitudCliente,
  listarSolicitudesCliente,
  registrarSolicitudCliente,
} from "./solicitudes-cliente-api";

// ---------------------------------------------------------------------------
// Mutaciones (migrado desde cotizaciones-queries.ts)
// ---------------------------------------------------------------------------

export function useRegistrarSCMutation() {
  return useMutar<
    PayloadRegistrarSC,
    Awaited<ReturnType<typeof registrarSolicitudCliente>>
  >({
    fn: registrarSolicitudCliente,
  });
}

// ---------------------------------------------------------------------------
// Consultas (reads)
// ---------------------------------------------------------------------------

export function useSolicitudesClienteQuery(filtros: FiltrosSolicitudesCliente = {}) {
  return useConsulta(
    () => listarSolicitudesCliente(filtros),
    [JSON.stringify(filtros)]
  );
}

export function useSolicitudClienteQuery(id: string) {
  return useConsulta(
    () => consultarSolicitudCliente(id),
    [id],
    { enabled: Boolean(id) }
  );
}

// ---------------------------------------------------------------------------
// Mutaciones (nuevas)
// ---------------------------------------------------------------------------

export function useAgregarCotizacionMutation() {
  return useMutar<
    { id: string; payload: PayloadBorrador },
    Awaited<ReturnType<typeof agregarCotizacion>>
  >({
    fn: ({ id, payload }) => agregarCotizacion(id, payload),
  });
}

export function useDescartarSCMutation() {
  return useMutar<
    { id: string; payload: PayloadDescartarSC },
    Awaited<ReturnType<typeof descartarSolicitudCliente>>
  >({
    fn: ({ id, payload }) => descartarSolicitudCliente(id, payload),
  });
}
