"use client";

import { extraerMensajeError } from "@/compartido/api";
import { useListarCotizaciones } from "@/modulos/comercial/cotizaciones/servicios/cotizaciones-queries";

import { DashboardListaAccionable } from "./dashboard-lista-accionable";
import { filtrarPorVencer } from "../utilidades/por-vencer";
import type {
  DashboardItemAccionable,
  DashboardListaEspecificaProps,
} from "../tipos/dashboard.tipos";

// Recorte presentacional del widget (no de negocio): el bucket "enviadas" se
// trae sin `porPagina` fijo porque el filtro de 72h corre despues en cliente
// (D6); recortar la pagina ANTES de filtrar podria descartar cotizaciones que
// si vencen pronto pero cayeron fuera de una pagina de 5. Se recorta DESPUES.
const MAX_ITEMS = 5;

/**
 * Lista "Cotizaciones enviadas por vencer" (spec homónima, regla de 72h en
 * cliente — design D6, deuda documentada y aislada en `utilidades/por-vencer`).
 * Trae el bucket `enviadas` bajo el filtro de ejecutivo vigente y filtra en
 * cliente las que vencen dentro de las próximas 72h.
 */
export function DashboardCotizacionesPorVencer({
  idEjecutivoResponsable,
}: DashboardListaEspecificaProps) {
  const { data, isLoading, isError, error } = useListarCotizaciones({
    bucket: "enviadas",
    idEjecutivoResponsable,
  });

  const items: DashboardItemAccionable[] = filtrarPorVencer(data?.data ?? [])
    .slice(0, MAX_ITEMS)
    .map((cotizacion) => ({
      id: cotizacion.id,
      titulo: cotizacion.codigoCotizacion ?? cotizacion.origenNombre,
      subtitulo: cotizacion.origenNombre,
      enlace: `/comercial/cotizaciones/${cotizacion.id}`,
    }));

  return (
    <DashboardListaAccionable
      titulo="Cotizaciones por vencer (72 h)"
      items={items}
      isLoading={isLoading}
      isError={isError}
      mensajeError={extraerMensajeError(
        error,
        "No se pudo cargar la lista de cotizaciones por vencer"
      )}
      enlaceVerTodas="/comercial/cotizaciones?bucket=enviadas"
    />
  );
}
