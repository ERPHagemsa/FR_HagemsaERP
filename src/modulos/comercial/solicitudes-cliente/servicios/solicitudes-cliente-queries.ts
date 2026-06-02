"use client";

import { useConsulta, useMutar } from "@/compartido/api";

import type { PayloadRegistrarSC } from "../../cotizaciones/tipos/cotizaciones.tipos";
import type {
  FiltrosSolicitudesCliente,
  PayloadDescartarSC,
} from "../tipos/solicitud-cliente.tipos";
import type { TipoDocumento } from "../../prospectos/tipos/prospecto.tipos";

import {
  agregarCotizacion,
  consultarSolicitudCliente,
  descartarSolicitudCliente,
  listarSolicitudesCliente,
  registrarSolicitudCliente,
  resolverIdentidad,
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

export function useResolverIdentidadQuery(
  tipoDocumento: TipoDocumento | "",
  numeroDocumento: string
) {
  return useConsulta(
    () => resolverIdentidad(tipoDocumento as TipoDocumento, numeroDocumento),
    [tipoDocumento, numeroDocumento],
    { enabled: Boolean(tipoDocumento && numeroDocumento) }
  );
}

// ---------------------------------------------------------------------------
// Mutaciones (nuevas)
// ---------------------------------------------------------------------------

export function useAgregarCotizacionMutation() {
  return useMutar<string, Awaited<ReturnType<typeof agregarCotizacion>>>({
    fn: agregarCotizacion,
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
