"use client";

import { invalidarConsulta, useConsulta, useMutar } from "@/compartido/api";
import { toast } from "sonner";

import {
  CLAVE_APROBACIONES,
  CLAVE_APROBACIONES_RESUMEN,
  CLAVE_APROBADORES,
  CLAVE_COTIZACION_APROBACIONES_HISTORIAL,
  CLAVE_COTIZACION_DETALLE,
  CLAVE_COTIZACIONES,
  CLAVE_COTIZACIONES_RESUMEN,
} from "../../claves-consulta";
import type {
  FiltrosAprobaciones,
  PayloadAprobar,
  PayloadRechazar,
} from "../tipos/aprobaciones.tipos";
import {
  aprobarSolicitud,
  listarAprobaciones,
  listarAprobadores,
  obtenerHistorialAprobaciones,
  obtenerResumenAprobaciones,
  rechazarSolicitud,
} from "./aprobaciones-api";

export function useAprobacionesQuery(filtros: FiltrosAprobaciones) {
  return useConsulta(
    () => listarAprobaciones(filtros),
    [
      filtros.estado,
      filtros.usuarioResolucion,
      filtros.numeroCotizacion,
      filtros.pagina,
      filtros.porPagina,
    ],
    { clave: CLAVE_APROBACIONES }
  );
}

export function useResumenAprobacionesQuery(params: {
  usuarioResolucion?: string;
  numeroCotizacion?: number;
}) {
  return useConsulta(
    () => obtenerResumenAprobaciones(params),
    [params.usuarioResolucion, params.numeroCotizacion],
    { clave: CLAVE_APROBACIONES_RESUMEN }
  );
}

export function useAprobadoresQuery() {
  return useConsulta(() => listarAprobadores(), [], { clave: CLAVE_APROBADORES });
}

export function useHistorialAprobacionesQuery(idCotizacion: string) {
  return useConsulta(
    () => obtenerHistorialAprobaciones(idCotizacion),
    [idCotizacion],
    { enabled: Boolean(idCotizacion), clave: CLAVE_COTIZACION_APROBACIONES_HISTORIAL }
  );
}

/** Refresca el listado tras un 409 (la solicitud ya la resolvio otra operacion). */
export function invalidarAprobaciones() {
  invalidarConsulta(CLAVE_APROBACIONES);
  invalidarConsulta(CLAVE_APROBACIONES_RESUMEN);
}

/**
 * Fuente unica de invalidacion tras resolver. Resolver cambia a la vez la
 * solicitud, sus KPIs, la cotizacion (estado/numeracion/vencimiento), los KPIs
 * de cotizaciones y el historial del detalle. Olvidar una clave deja UI stale.
 */
function invalidarTrasResolver() {
  invalidarConsulta(CLAVE_APROBACIONES);
  invalidarConsulta(CLAVE_APROBACIONES_RESUMEN);
  invalidarConsulta(CLAVE_APROBADORES);
  invalidarConsulta(CLAVE_COTIZACIONES);
  invalidarConsulta(CLAVE_COTIZACIONES_RESUMEN);
  invalidarConsulta(CLAVE_COTIZACION_DETALLE);
  invalidarConsulta(CLAVE_COTIZACION_APROBACIONES_HISTORIAL);
}

export function useAprobarMutation(idSolicitud: string) {
  return useMutar<PayloadAprobar | undefined, Awaited<ReturnType<typeof aprobarSolicitud>>>({
    fn: (payload) => aprobarSolicitud(idSolicitud, payload),
    onSuccess: () => {
      invalidarTrasResolver();
      toast.success("Solicitud aprobada correctamente.");
    },
  });
}

export function useRechazarMutation(idSolicitud: string) {
  return useMutar<PayloadRechazar, Awaited<ReturnType<typeof rechazarSolicitud>>>({
    fn: (payload) => rechazarSolicitud(idSolicitud, payload),
    onSuccess: () => {
      invalidarTrasResolver();
      toast.success("Solicitud rechazada correctamente.");
    },
  });
}

