"use client";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { PaginaListado } from "../../componentes/pagina-listado";
import { AprobacionesTabla } from "../componentes/aprobaciones-tabla";
import { useAprobacionesQuery } from "../servicios/aprobaciones-queries";
import type { FiltrosAprobaciones } from "../tipos/aprobaciones.tipos";

type Props = {
  filtros?: FiltrosAprobaciones;
};

export function AprobacionesVista({ filtros = {} }: Props) {
  const { data, isLoading, isError, error } = useAprobacionesQuery(filtros);

  return (
    <PaginaListado>
      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar aprobaciones</AlertTitle>
          <AlertDescription>
            {extraerMensajeError(error, "No se pudo cargar la lista de aprobaciones")}
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <AprobacionesTabla
          items={data?.data ?? []}
          filtros={filtros}
          total={data?.total ?? 0}
        />
      )}
    </PaginaListado>
  );
}
