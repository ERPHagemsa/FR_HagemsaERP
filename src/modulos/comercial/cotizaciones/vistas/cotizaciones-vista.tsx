"use client";

import { extraerMensajeError } from "@/compartido/api";
import { useConsulta } from "@/compartido/api/use-consulta";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { CotizacionesTabla } from "../componentes/cotizaciones-tabla";
import { listarCotizaciones } from "../servicios/cotizaciones-api";
import type { FiltrosCotizaciones } from "../tipos/cotizaciones.tipos";

type Props = {
  filtros?: FiltrosCotizaciones;
  filtrosRaw?: {
    estado?: string;
    origenTipo?: string;
    busqueda?: string;
    pagina?: number;
    porPagina?: number;
  };
};

export function CotizacionesVista({
  filtros = {},
  filtrosRaw = {},
}: Props) {
  const { data, isLoading, isError, error } = useConsulta(
    () => listarCotizaciones(filtros),
    [JSON.stringify(filtros)]
  );

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar cotizaciones</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(
                error,
                "No se pudo cargar la lista de cotizaciones"
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : null}

        {!isLoading && !isError && data ? (
          <CotizacionesTabla
            respuesta={data}
            filtrosActivos={filtrosRaw}
          />
        ) : null}
      </div>
    </main>
  );
}
