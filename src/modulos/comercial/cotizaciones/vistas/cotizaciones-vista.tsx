"use client";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { PaginaListado } from "../../componentes/pagina-listado";
import { CotizacionesTabla } from "../componentes/cotizaciones-tabla";
import { useListarCotizaciones } from "../servicios/cotizaciones-queries";
import type { FiltrosCotizaciones } from "../tipos/cotizaciones.tipos";

type Props = {
  filtros?: FiltrosCotizaciones;
};

export function CotizacionesVista({ filtros = {} }: Props) {
  const { data, isLoading, isError, error } = useListarCotizaciones(filtros);

  return (
    <PaginaListado>
      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar cotizaciones</AlertTitle>
          <AlertDescription>
            {extraerMensajeError(error, "No se pudo cargar la lista de cotizaciones")}
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <CotizacionesTabla
          items={data?.data ?? []}
          filtros={filtros}
          total={data?.total ?? 0}
        />
      )}
    </PaginaListado>
  );
}
