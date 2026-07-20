"use client";

import { useState } from "react";

import { DashboardAcciones } from "../componentes/dashboard-acciones";
import { DashboardCicloCierre } from "../componentes/dashboard-ciclo-cierre";
import { DashboardEmbudo } from "../componentes/dashboard-embudo";
import { DashboardFiltroEjecutivo } from "../componentes/dashboard-filtro-ejecutivo";
import { DashboardKpisConsolidado } from "../componentes/dashboard-kpis-consolidado";
import { DashboardMotivosPerdida } from "../componentes/dashboard-motivos-perdida";
import { DashboardMotivosRespuestaCliente } from "../componentes/dashboard-motivos-respuesta-cliente";
import { DashboardRanking } from "../componentes/dashboard-ranking";
import { DashboardSelectorPeriodo } from "../componentes/dashboard-selector-periodo";
import { DashboardTendencia } from "../componentes/dashboard-tendencia";
import { resolverPeriodoPreset } from "../utilidades/periodo-preset";
import type { IdEjecutivoFiltro, RangoPeriodo } from "../tipos/dashboard.tipos";

/**
 * Vista de orquestación del dashboard (design D4/D5, Fase 2b): eleva dos
 * estados — `idEjecutivoResponsable` (Fase 1, sin cambios de contrato) y
 * `periodo` (nuevo, default preset "este-mes") — y los baja por props a los
 * widgets con la propagación exacta de design D5:
 * - `periodo` + `idEjecutivoResponsable`: tendencia, ciclo-cierre,
 *   motivos-perdida, embudo. (La tendencia ANTES tenía ventana propia fija;
 *   ahora sigue el período como el resto y el backend adapta la granularidad.)
 * - solo `periodo`: ranking (el endpoint ignora el filtro de ejecutivo,
 *   D-restricción verificada).
 * - solo `idEjecutivoResponsable`: acciones (no dependiente de período).
 *
 * `DashboardWinRate` (donut ganadas/perdidas del período) se ELIMINÓ —
 * pedido de producto: era una foto redundante. La tendencia mensual ahora
 * grafica cotizaciones ganadas vs. perdidas apiladas, así que la proporción
 * de éxito se lee en el tiempo dentro de ese gráfico y el donut sobraba. La
 * tendencia comparte fila con `DashboardCicloCierre` (2/3 y 1/3) para no
 * dejar a este último solo y vacío a lo ancho.
 *
 * Cambio dashboard-kpis-motivos-respuesta-front: agrega
 * `DashboardKpisConsolidado` (ancho completo, primero — resume el período)
 * y `DashboardMotivosRespuestaCliente` (ancho completo, pegado a la fila
 * motivos-perdida/embudo — misma zona diagnóstica de "por qué no ganamos").
 * Ambos con `periodo` + `idEjecutivoResponsable`, igual que los widgets
 * vecinos.
 *
 * `DashboardKpisDinero` (Ganado/Pipeline/Ticket promedio) se ELIMINÓ —
 * pedido explícito de producto: era ilegible y su dato principal (Ganado)
 * ya está en `DashboardKpisConsolidado`, que lo reemplaza. El endpoint
 * `/dashboard/kpis-monetarios` se retira en paralelo en el backend.
 */
export function DashboardVista() {
  const [idEjecutivoResponsable, setIdEjecutivoResponsable] =
    useState<IdEjecutivoFiltro>(undefined);
  const [periodo, setPeriodo] = useState<RangoPeriodo>(() =>
    resolverPeriodoPreset("este-mes")
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <DashboardFiltroEjecutivo
          idEjecutivoResponsable={idEjecutivoResponsable}
          alCambiar={setIdEjecutivoResponsable}
        />
        <DashboardSelectorPeriodo periodo={periodo} alCambiar={setPeriodo} />
      </div>

      <DashboardKpisConsolidado
        periodo={periodo}
        idEjecutivoResponsable={idEjecutivoResponsable}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardTendencia
            periodo={periodo}
            idEjecutivoResponsable={idEjecutivoResponsable}
          />
        </div>
        <DashboardCicloCierre
          periodo={periodo}
          idEjecutivoResponsable={idEjecutivoResponsable}
        />
      </div>

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

      <DashboardMotivosRespuestaCliente
        periodo={periodo}
        idEjecutivoResponsable={idEjecutivoResponsable}
      />

      <DashboardAcciones idEjecutivoResponsable={idEjecutivoResponsable} />
    </div>
  );
}
