"use client";

import { invalidarConsulta, useConsulta, useMutar } from "@/compartido/api";
import { toast } from "sonner";

import {
  CLAVE_APROBACIONES_PENDIENTES,
  CLAVE_COTIZACION_APROBACIONES_HISTORIAL,
  CLAVE_COTIZACION_DETALLE,
  CLAVE_COTIZACIONES,
  CLAVE_COTIZACIONES_RESUMEN,
} from "../../claves-consulta";
import type { PayloadAprobar, PayloadObservar, PayloadRechazar } from "../tipos/aprobaciones.tipos";
import {
  aprobarSolicitud,
  listarPendientes,
  observarSolicitud,
  obtenerHistorialAprobaciones,
  rechazarSolicitud,
} from "./aprobaciones-api";

export function useAprobacionesPendientesQuery(params: { pagina: number; porPagina: number }) {
  return useConsulta(
    () => listarPendientes(params),
    [params.pagina, params.porPagina],
    { clave: CLAVE_APROBACIONES_PENDIENTES }
  );
}

export function useHistorialAprobacionesQuery(idCotizacion: string) {
  return useConsulta(
    () => obtenerHistorialAprobaciones(idCotizacion),
    [idCotizacion],
    { enabled: Boolean(idCotizacion), clave: CLAVE_COTIZACION_APROBACIONES_HISTORIAL }
  );
}

export function invalidarAprobacionesPendientes() {
  invalidarConsulta(CLAVE_APROBACIONES_PENDIENTES);
}

function invalidarTrasResolver() {
  invalidarConsulta(CLAVE_APROBACIONES_PENDIENTES);
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

export function useObservarMutation(idSolicitud: string) {
  return useMutar<PayloadObservar, Awaited<ReturnType<typeof observarSolicitud>>>({
    fn: (payload) => observarSolicitud(idSolicitud, payload),
    onSuccess: () => {
      invalidarTrasResolver();
      toast.success("Solicitud observada correctamente.");
    },
  });
}
