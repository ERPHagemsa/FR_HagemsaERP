"use client";

import { invalidarConsulta, useConsulta, useMutar } from "@/compartido/api";

import type {
  PayloadBorrador,
  PayloadRegistrarSC,
} from "../../cotizaciones/tipos/cotizaciones.tipos";
import type {
  FiltrosResumenSolicitudes,
  FiltrosSolicitudesCliente,
  PayloadDescartarSC,
} from "../tipos/solicitud-cliente.tipos";

import {
  agregarCotizacion,
  consultarSolicitudCliente,
  descartarSolicitudCliente,
  listarSolicitudesCliente,
  obtenerResumenSolicitudes,
  registrarSolicitudCliente,
} from "./solicitudes-cliente-api";

import {
  CLAVE_COTIZACIONES,
  CLAVE_SOLICITUD_CLIENTE_DETALLE,
  CLAVE_SOLICITUDES_CLIENTE,
  CLAVE_SOLICITUDES_CLIENTE_RESUMEN,
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
      invalidarConsulta(CLAVE_SOLICITUDES_CLIENTE_RESUMEN);
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

// KPIs del pipeline. Solo depende del contexto (origenTipo/origenId/busqueda):
// no refetchea al cambiar de bucket o de pagina, porque la franja muestra
// SIEMPRE todos los buckets bajo el mismo contexto.
export function useResumenSolicitudesQuery(filtros: FiltrosResumenSolicitudes = {}) {
  return useConsulta(
    () => obtenerResumenSolicitudes(filtros),
    [JSON.stringify(filtros)],
    { clave: CLAVE_SOLICITUDES_CLIENTE_RESUMEN }
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
      invalidarConsulta(CLAVE_SOLICITUDES_CLIENTE_RESUMEN);
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
      invalidarConsulta(CLAVE_SOLICITUDES_CLIENTE_RESUMEN);
      invalidarConsulta(CLAVE_SOLICITUD_CLIENTE_DETALLE);
    },
  });
}
