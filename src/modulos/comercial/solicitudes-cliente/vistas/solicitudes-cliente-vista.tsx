"use client";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { PaginaListado } from "../../componentes/pagina-listado";
import { SolicitudesClienteTabla } from "../componentes/solicitudes-cliente-tabla";
import { useSolicitudesClienteQuery } from "../servicios/solicitudes-cliente-queries";
import type { FiltrosSolicitudesCliente } from "../tipos/solicitud-cliente.tipos";

type Props = {
  filtros?: FiltrosSolicitudesCliente;
};

export function SolicitudesClienteVista({ filtros = {} }: Props) {
  const { data, isLoading, isError, error } = useSolicitudesClienteQuery(filtros);

  return (
    <PaginaListado>
      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar solicitudes</AlertTitle>
          <AlertDescription>
            {extraerMensajeError(
              error,
              "No se pudo cargar la lista de solicitudes de cliente"
            )}
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <SolicitudesClienteTabla
          items={data?.data ?? []}
          filtros={filtros}
          total={data?.total ?? 0}
        />
      )}
    </PaginaListado>
  );
}
