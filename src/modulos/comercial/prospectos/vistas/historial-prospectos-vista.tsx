"use client";

import { extraerMensajeError } from "@/compartido/api";
import { useConsulta } from "@/compartido/api/use-consulta";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { HistorialProspectosTabla } from "../componentes/historial-prospectos-tabla";
import { obtenerHistorialProspectos } from "../servicios/prospectos-api";
import type { FiltrosHistorial } from "../tipos/prospecto.tipos";

type Props = {
  filtros?: FiltrosHistorial;
  filtrosRaw?: {
    accion?: string;
    desde?: string;
    hasta?: string;
    pagina?: number;
    porPagina?: number;
  };
};

export function HistorialProspectosVista({
  filtros = {},
  filtrosRaw = {},
}: Props) {
  const { data, isLoading, isError, error } = useConsulta(
    () => obtenerHistorialProspectos(filtros),
    [JSON.stringify(filtros)],
  );

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar el historial</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudo cargar el historial")}
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : null}

        {data ? (
          <HistorialProspectosTabla
            respuesta={data}
            filtrosActivos={filtrosRaw}
          />
        ) : null}
      </div>
    </main>
  );
}
