"use client";

import { useState } from "react";

import { DashboardAcciones } from "../componentes/dashboard-acciones";
import { DashboardCicloCierre } from "../componentes/dashboard-ciclo-cierre";
import { DashboardEmbudo } from "../componentes/dashboard-embudo";
import { DashboardFiltroEjecutivo } from "../componentes/dashboard-filtro-ejecutivo";
import { DashboardKpisDinero } from "../componentes/dashboard-kpis-dinero";
import { DashboardMotivosPerdida } from "../componentes/dashboard-motivos-perdida";
import { DashboardRanking } from "../componentes/dashboard-ranking";
import { DashboardSelectorPeriodo } from "../componentes/dashboard-selector-periodo";
import { DashboardTendencia } from "../componentes/dashboard-tendencia";
import { DashboardWinRate } from "../componentes/dashboard-win-rate";
import { resolverPeriodoPreset } from "../utilidades/periodo-preset";
import type { IdEjecutivoFiltro, RangoPeriodo } from "../tipos/dashboard.tipos";

/**
 * Vista de orquestación del dashboard (design D4/D5, Fase 2b): eleva dos
 * estados — `idEjecutivoResponsable` (Fase 1, sin cambios de contrato) y
 * `periodo` (nuevo, default preset "este-mes") — y los baja por props a los
 * 8 widgets con la propagación exacta de design D5:
 * - `periodo` + `idEjecutivoResponsable`: kpis-dinero, win-rate, ciclo-cierre,
 *   motivos-perdida, embudo.
 * - solo `periodo`: ranking (el endpoint ignora el filtro de ejecutivo,
 *   D-restricción verificada).
 * - solo `idEjecutivoResponsable`: tendencia (ventana propia `meses`, D6) y
 *   acciones (no dependiente de período).
 */
export function DashboardVista() {
  const [idEjecutivoResponsable, setIdEjecutivoResponsable] =
    useState<IdEjecutivoFiltro>(undefined);
  const [periodo, setPeriodo] = useState<RangoPeriodo>(() =>
    resolverPeriodoPreset("este-mes")
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <DashboardFiltroEjecutivo
          idEjecutivoResponsable={idEjecutivoResponsable}
          alCambiar={setIdEjecutivoResponsable}
        />
        <DashboardSelectorPeriodo periodo={periodo} alCambiar={setPeriodo} />
      </div>

      <DashboardKpisDinero
        periodo={periodo}
        idEjecutivoResponsable={idEjecutivoResponsable}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardWinRate
          periodo={periodo}
          idEjecutivoResponsable={idEjecutivoResponsable}
        />
        <DashboardCicloCierre
          periodo={periodo}
          idEjecutivoResponsable={idEjecutivoResponsable}
        />
      </div>

      <DashboardTendencia idEjecutivoResponsable={idEjecutivoResponsable} />

      <DashboardRanking periodo={periodo} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardMotivosPerdida
          periodo={periodo}
          idEjecutivoResponsable={idEjecutivoResponsable}
        />
        <DashboardEmbudo
          periodo={periodo}
          idEjecutivoResponsable={idEjecutivoResponsable}
        />
      </div>

      <DashboardAcciones idEjecutivoResponsable={idEjecutivoResponsable} />
    </div>
  );
}
