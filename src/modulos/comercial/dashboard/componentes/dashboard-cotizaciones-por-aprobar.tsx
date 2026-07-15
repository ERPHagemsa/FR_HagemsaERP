"use client";

import { extraerMensajeError } from "@/compartido/api";
import { useListarCotizaciones } from "@/modulos/comercial/cotizaciones/servicios/cotizaciones-queries";

import { DashboardListaAccionable } from "./dashboard-lista-accionable";
import type {
  DashboardItemAccionable,
  DashboardListaEspecificaProps,
} from "../tipos/dashboard.tipos";

const POR_PAGINA = 5;

/**
 * Lista "Cotizaciones pendientes de aprobación" (spec homónima): bucket
 * `pendientesAprobacion` del listado ya existente (`useListarCotizaciones`),
 * bajo el filtro de ejecutivo vigente. Deep-link "ver todas" al listado
 * completo con el mismo bucket preseleccionado.
 */
export function DashboardCotizacionesPorAprobar({
  idEjecutivoResponsable,
}: DashboardListaEspecificaProps) {
  const { data, isLoading, isError, error } = useListarCotizaciones({
    bucket: "pendientesAprobacion",
    idEjecutivoResponsable,
    porPagina: POR_PAGINA,
  });

  const items: DashboardItemAccionable[] = (data?.data ?? []).map(
    (cotizacion) => ({
      id: cotizacion.id,
      titulo: cotizacion.codigoCotizacion ?? cotizacion.origenNombre,
      subtitulo: cotizacion.origenNombre,
      enlace: `/comercial/cotizaciones/${cotizacion.id}`,
    })
  );

  return (
    <DashboardListaAccionable
      titulo="Cotizaciones pendientes de aprobación"
      items={items}
      isLoading={isLoading}
      isError={isError}
      mensajeError={extraerMensajeError(
        error,
        "No se pudo cargar la lista de cotizaciones pendientes de aprobación"
      )}
      enlaceVerTodas="/comercial/cotizaciones?bucket=pendientesAprobacion"
    />
  );
}
