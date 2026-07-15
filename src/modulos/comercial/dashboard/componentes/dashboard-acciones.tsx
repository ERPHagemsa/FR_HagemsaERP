"use client";

import { extraerMensajeError } from "@/compartido/api";
import { formatearMoneda } from "@/compartido/utilidades/formato-moneda";

import { DashboardListaAccionable } from "./dashboard-lista-accionable";
import { DASHBOARD_AYUDA } from "../dashboard-ayuda";
import { useAccionesPendientesQuery } from "../servicios/dashboard-queries";
import type {
  AccionPendiente,
  DashboardItemAccionable,
  FiltrosDashboardAcciones,
} from "../tipos/dashboard.tipos";

function mapearAccion(
  accion: AccionPendiente,
  enlaceBase: string
): DashboardItemAccionable {
  const partesSubtitulo: string[] = [];
  if (accion.nombreEjecutivoResponsable) {
    partesSubtitulo.push(accion.nombreEjecutivoResponsable);
  }
  if (accion.monto !== null && accion.moneda !== null) {
    partesSubtitulo.push(formatearMoneda(accion.monto, accion.moneda));
  }

  return {
    id: accion.id,
    titulo: accion.referencia,
    subtitulo: partesSubtitulo.length > 0 ? partesSubtitulo.join(" · ") : undefined,
    enlace: `${enlaceBase}/${accion.id}`,
  };
}

/**
 * Acciones pendientes (design D4/D11, tarea 3.8): consume
 * `useAccionesPendientesQuery({ idEjecutivoResponsable })` — sin período; 3
 * columnas reusando `DashboardListaAccionable`. `porVencer72h` y
 * `esperandoAprobacion` referencian cotizaciones; `solicitudesSinCotizar`
 * referencia solicitudes (invariante de dominio: nunca tiene ejecutivo
 * asignado, no varía con el filtro de ejecutivo). Sin cálculo de negocio en
 * cliente — la regla de 72h ya viene resuelta por backend.
 */
export function DashboardAcciones({
  idEjecutivoResponsable,
}: FiltrosDashboardAcciones) {
  const { data, isLoading, isError, error } = useAccionesPendientesQuery({
    idEjecutivoResponsable,
  });

  const mensajeError = extraerMensajeError(
    error,
    "No se pudo cargar la lista de acciones pendientes"
  );

  const porVencer = (data?.porVencer72h ?? []).map((accion) =>
    mapearAccion(accion, "/comercial/cotizaciones")
  );
  const esperandoAprobacion = (data?.esperandoAprobacion ?? []).map((accion) =>
    mapearAccion(accion, "/comercial/cotizaciones")
  );
  const sinCotizar = (data?.solicitudesSinCotizar ?? []).map((accion) =>
    mapearAccion(accion, "/comercial/solicitudes-cliente")
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <DashboardListaAccionable
        titulo="Por vencer (72h)"
        items={porVencer}
        isLoading={isLoading}
        isError={isError}
        mensajeError={mensajeError}
        enlaceVerTodas="/comercial/cotizaciones?bucket=porVencer"
        ayuda={DASHBOARD_AYUDA.accionesPorVencer}
      />
      <DashboardListaAccionable
        titulo="Esperando aprobación"
        items={esperandoAprobacion}
        isLoading={isLoading}
        isError={isError}
        mensajeError={mensajeError}
        enlaceVerTodas="/comercial/cotizaciones?bucket=pendientesAprobacion"
        ayuda={DASHBOARD_AYUDA.accionesEsperandoAprobacion}
      />
      <DashboardListaAccionable
        titulo="Solicitudes sin cotizar"
        items={sinCotizar}
        isLoading={isLoading}
        isError={isError}
        mensajeError={mensajeError}
        enlaceVerTodas="/comercial/solicitudes-cliente?bucket=disponibles"
        ayuda={DASHBOARD_AYUDA.accionesSinCotizar}
      />
    </div>
  );
}
