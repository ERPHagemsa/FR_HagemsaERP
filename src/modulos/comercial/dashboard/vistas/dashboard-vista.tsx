"use client";

import { useState } from "react";

import { DashboardEmbudo } from "../componentes/dashboard-embudo";
import { DashboardFiltroEjecutivo } from "../componentes/dashboard-filtro-ejecutivo";
import { DashboardKpisConsolidado } from "../componentes/dashboard-kpis-consolidado";
import { DashboardMotivosPerdida } from "../componentes/dashboard-motivos-perdida";
import { DashboardRanking } from "../componentes/dashboard-ranking";
import { DashboardResultados } from "../componentes/dashboard-resultados";
import { DashboardSelectorPeriodo } from "../componentes/dashboard-selector-periodo";
import { DashboardTendencia } from "../componentes/dashboard-tendencia";
import { resolverPeriodoPreset } from "../utilidades/periodo-preset";
import type { IdEjecutivoFiltro, RangoPeriodo } from "../tipos/dashboard.tipos";

/**
 * Vista de orquestación del dashboard (design D4/D5, Fase 2b): eleva dos
 * estados — `idEjecutivoResponsable` (Fase 1, sin cambios de contrato) y
 * `periodo` (nuevo, default preset "este-mes") — y los baja por props a los
 * widgets con la propagación exacta de design D5:
 * - `periodo` + `idEjecutivoResponsable`: tendencia, motivos-perdida, embudo,
 *   y el tile de ciclo-cierre (que ahora vive DENTRO del strip de KPIs). La
 *   tendencia sigue el período y el backend adapta la granularidad.
 * - solo `periodo`: ranking (el endpoint ignora el filtro de ejecutivo,
 *   D-restricción verificada).
 *
 * Las 3 listas de "acciones pendientes" se reemplazaron por 3 KPIs clickeables
 * (Por vencer / Esperando aprobación / Sin cotizar) que viven DENTRO del strip
 * (`DashboardKpisConsolidado`): son estado ACTUAL (no dependen del período) y
 * navegan al listado filtrado por su bucket. Su data la traen ellos mismos
 * (resumen de cotizaciones / de solicitudes), no `DashboardVista`.
 *
 * Reorganización de producto: `DashboardWinRate` (donut) se ELIMINÓ (su
 * proporción se lee en la tendencia interactiva). Ganadas/Perdidas se sacaron
 * del strip de KPIs (son los totales del bar chart de tendencia) y
 * `DashboardCicloCierre` dejó de ser un widget suelto —desperdiciaba todo el
 * ancho en un solo número— y ahora es un tile más DENTRO del strip
 * (`DashboardKpisConsolidado`). La fila de la tendencia se comparte con
 * `DashboardMotivosPerdida` (2/3 y 1/3: la tendencia lleva más ancho por su
 * header de totales; motivos entra bien en 1/3). Debajo va un bloque de dos
 * columnas (2/3 + 1/3): la columna izquierda de 2/3 apila `DashboardResultados`
 * y `DashboardRanking`; la columna derecha de 1/3 lleva `DashboardEmbudo`.
 *
 * El widget "Respuesta del cliente" se ELIMINÓ (decisión de producto): los
 * motivos del catálogo que eligió el cliente al rechazar ya se ven en
 * `DashboardMotivosPerdida` (pie con la descripción en el hover); la vista de
 * motivos de negociación se descartó junto con el widget.
 *
 * `DashboardKpisDinero` (Ganado/Pipeline/Ticket promedio) se ELIMINÓ —
 * pedido explícito de producto: era ilegible y su dato principal (Ganado)
 * ya está en `DashboardResultados`, que lo reemplaza. El endpoint
 * `/dashboard/kpis-monetarios` se retira en paralelo en el backend.
 *
 * `DashboardResultados` (Lo ganado en el período: Monto / Utilidad / Margen)
 * vive en la columna de 2/3, arriba del `DashboardRanking` y a la misma anchura;
 * consume el mismo `kpis-consolidado` (campo `cerrado`) con `periodo` + ejecutivo.
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
        <DashboardMotivosPerdida
          periodo={periodo}
          idEjecutivoResponsable={idEjecutivoResponsable}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <DashboardResultados
            periodo={periodo}
            idEjecutivoResponsable={idEjecutivoResponsable}
          />
          <DashboardRanking periodo={periodo} />
        </div>
        <div className="flex flex-col gap-4">
          <DashboardEmbudo
            periodo={periodo}
            idEjecutivoResponsable={idEjecutivoResponsable}
          />
        </div>
      </div>
    </div>
  );
}
