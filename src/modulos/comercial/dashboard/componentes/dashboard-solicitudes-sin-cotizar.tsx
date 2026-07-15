"use client";

import { extraerMensajeError } from "@/compartido/api";
import { useSolicitudesClienteQuery } from "@/modulos/comercial/solicitudes-cliente/servicios/solicitudes-cliente-queries";
import type { SolicitudClienteResumen } from "@/modulos/comercial/solicitudes-cliente/tipos/solicitud-cliente.tipos";

import { DashboardListaAccionable } from "./dashboard-lista-accionable";
import type { DashboardItemAccionable } from "../tipos/dashboard.tipos";

const POR_PAGINA = 5;

// Orden "más antiguas primero" (spec "Lista de solicitudes sin cotizar"). Se
// ordena en cliente sobre la página devuelta — el orden del backend para este
// bucket no está confirmado (design.md, Open Questions), así que no se asume.
function ordenarPorAntiguedad(
  items: SolicitudClienteResumen[]
): SolicitudClienteResumen[] {
  return [...items].sort(
    (a, b) =>
      new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()
  );
}

/**
 * Lista "Solicitudes sin cotizar" (spec homónima): bucket `disponibles`
 * (estado `PENDIENTE`) del listado ya existente
 * (`useSolicitudesClienteQuery`). Ámbito ÁREA a propósito — sin
 * `idEjecutivoResponsable`: `FiltrosResumenSolicitudes`/
 * `FiltrosSolicitudesCliente` no lo aceptan (restricción verificada en
 * design.md; Fase 2 backend). Por eso este widget no recibe props de filtro.
 */
export function DashboardSolicitudesSinCotizar() {
  const { data, isLoading, isError, error } = useSolicitudesClienteQuery({
    bucket: "disponibles",
    porPagina: POR_PAGINA,
  });

  const items: DashboardItemAccionable[] = ordenarPorAntiguedad(
    data?.data ?? []
  ).map((solicitud) => ({
    id: solicitud.id,
    titulo: solicitud.codigoSolicitud ?? solicitud.nombreSolicitante,
    subtitulo: solicitud.nombreSolicitante,
    enlace: `/comercial/solicitudes-cliente/${solicitud.id}`,
  }));

  return (
    <DashboardListaAccionable
      titulo="Solicitudes sin cotizar"
      items={items}
      isLoading={isLoading}
      isError={isError}
      mensajeError={extraerMensajeError(
        error,
        "No se pudo cargar la lista de solicitudes sin cotizar"
      )}
      enlaceVerTodas="/comercial/solicitudes-cliente?bucket=disponibles"
    />
  );
}
