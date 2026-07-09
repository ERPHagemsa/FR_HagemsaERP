"use client";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { PaginaListado } from "../../componentes/pagina-listado";

import { AprobacionesBandejaTabla } from "../componentes/aprobaciones-bandeja-tabla";
import { useAprobacionesPendientesQuery } from "../servicios/aprobaciones-queries";

type Props = {
  pagina: number;
  porPagina: number;
};

export function AprobacionesVista({ pagina, porPagina }: Props) {
  const { data, isLoading, isError, error } = useAprobacionesPendientesQuery({ pagina, porPagina });

  return (
    <PaginaListado>
      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar aprobaciones</AlertTitle>
          <AlertDescription>
            {extraerMensajeError(error, "No se pudo cargar la bandeja de aprobaciones")}
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <AprobacionesBandejaTabla
          items={data?.data ?? []}
          pagina={data?.pagina ?? pagina}
          porPagina={data?.porPagina ?? porPagina}
          total={data?.total ?? 0}
        />
      )}
    </PaginaListado>
  );
}
