"use client";

import { useState } from "react";

import { DashboardCotizacionesPorAprobar } from "../componentes/dashboard-cotizaciones-por-aprobar";
import { DashboardCotizacionesPorVencer } from "../componentes/dashboard-cotizaciones-por-vencer";
import { DashboardFiltroEjecutivo } from "../componentes/dashboard-filtro-ejecutivo";
import { DashboardKpis } from "../componentes/dashboard-kpis";
import { DashboardSolicitudesSinCotizar } from "../componentes/dashboard-solicitudes-sin-cotizar";
import type { IdEjecutivoFiltro } from "../tipos/dashboard.tipos";

/**
 * Vista de orquestación del dashboard (design D2/D3): eleva el estado del
 * filtro de ejecutivo (`undefined` = "Todos") y lo baja por props a los
 * widgets de Cotizaciones; `DashboardSolicitudesSinCotizar` queda a nivel
 * área y no recibe el filtro (restricción verificada en design.md).
 */
export function DashboardVista() {
  const [idEjecutivoResponsable, setIdEjecutivoResponsable] =
    useState<IdEjecutivoFiltro>(undefined);

  return (
    <div className="flex flex-col gap-6">
      <DashboardFiltroEjecutivo
        idEjecutivoResponsable={idEjecutivoResponsable}
        alCambiar={setIdEjecutivoResponsable}
      />

      <DashboardKpis idEjecutivoResponsable={idEjecutivoResponsable} />

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardCotizacionesPorAprobar
          idEjecutivoResponsable={idEjecutivoResponsable}
        />
        <DashboardSolicitudesSinCotizar />
        <DashboardCotizacionesPorVencer
          idEjecutivoResponsable={idEjecutivoResponsable}
        />
      </div>
    </div>
  );
}
