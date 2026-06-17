"use client";

import { extraerMensajeError } from "@/compartido/api";
import { useConsulta } from "@/compartido/api/use-consulta";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { ProspectosTabla } from "../componentes/prospectos-tabla";
import { listarProspectos } from "../servicios/prospectos-api";
import type { FiltrosProspectos } from "../tipos/prospecto.tipos";

type Props = {
  filtros?: FiltrosProspectos;
  filtrosRaw?: {
    estado?: string;
    idEjecutivoResponsable?: string;
    busqueda?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    pagina?: number;
    porPagina?: number;
  };
};

export function ProspectosVista({ filtros = {}, filtrosRaw = {} }: Props) {
  const { data, isLoading, isError, error } = useConsulta(
    () => listarProspectos(filtros),
    [JSON.stringify(filtros)],
  );

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar prospectos</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudo cargar la lista de prospectos")}
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : null}

        {!isLoading && data ? (
          <ProspectosTabla respuesta={data} filtrosActivos={filtrosRaw} />
        ) : null}
      </div>
    </main>
  );
}
