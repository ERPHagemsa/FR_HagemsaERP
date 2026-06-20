"use client";

import { invalidarConsulta, useConsulta, useMutar } from "@/compartido/api";

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

import {
  CLAVE_COTIZACIONES,
  CLAVE_SOLICITUD_CLIENTE_DETALLE,
  CLAVE_SOLICITUDES_CLIENTE,
} from "../../claves-consulta";

// Re-exportar para que los importadores existentes de este archivo sigan funcionando.
export { CLAVE_SOLICITUDES_CLIENTE, CLAVE_SOLICITUD_CLIENTE_DETALLE } from "../../claves-consulta";

// ---------------------------------------------------------------------------
// Mutaciones (migrado desde cotizaciones-queries.ts)
// ---------------------------------------------------------------------------

export function useRegistrarSCMutation() {
  return useMutar<
    PayloadRegistrarSC,
    Awaited<ReturnType<typeof registrarSolicitudCliente>>
  >({
    fn: registrarSolicitudCliente,
    onSuccess: () => {
      invalidarConsulta(CLAVE_SOLICITUDES_CLIENTE);
    },
  });
}

// ---------------------------------------------------------------------------
// Consultas (reads)
// ---------------------------------------------------------------------------

export function useSolicitudesClienteQuery(filtros: FiltrosSolicitudesCliente = {}) {
  return useConsulta(
    () => listarSolicitudesCliente(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_SOLICITUDES_CLIENTE }
  );
}

export function useSolicitudClienteQuery(id: string) {
  return useConsulta(
    () => consultarSolicitudCliente(id),
    [id],
    { enabled: Boolean(id), clave: CLAVE_SOLICITUD_CLIENTE_DETALLE }
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
    onSuccess: () => {
      invalidarConsulta(CLAVE_COTIZACIONES);
      invalidarConsulta(CLAVE_SOLICITUDES_CLIENTE);
      invalidarConsulta(CLAVE_SOLICITUD_CLIENTE_DETALLE);
    },
  });
}

export function useDescartarSCMutation() {
  return useMutar<
    { id: string; payload: PayloadDescartarSC },
    Awaited<ReturnType<typeof descartarSolicitudCliente>>
  >({
    fn: ({ id, payload }) => descartarSolicitudCliente(id, payload),
    onSuccess: () => {
      invalidarConsulta(CLAVE_SOLICITUDES_CLIENTE);
      invalidarConsulta(CLAVE_SOLICITUD_CLIENTE_DETALLE);
    },
  });
}
