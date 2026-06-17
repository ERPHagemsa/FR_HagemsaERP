"use client";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { SolicitudesClienteTabla } from "../componentes/solicitudes-cliente-tabla";
import { useSolicitudesClienteQuery } from "../servicios/solicitudes-cliente-queries";
import type { FiltrosSolicitudesCliente } from "../tipos/solicitud-cliente.tipos";

type Props = {
  filtros?: FiltrosSolicitudesCliente;
};

export function SolicitudesClienteVista({ filtros = {} }: Props) {
  const { data, isLoading, isError, error } = useSolicitudesClienteQuery(filtros);

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
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
      </div>
    </main>
  );
}
