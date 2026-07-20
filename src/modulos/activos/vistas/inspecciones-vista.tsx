"use client";

import { extraerMensajeError } from "@/compartido/api";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { InspeccionesListado } from "../componentes/inspecciones-listado";
import { useInspeccionesQuery } from "../servicios/inspeccion-queries";

export function InspeccionesVista() {
  const { data, isLoading, isError, error } = useInspeccionesQuery();

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar la inspeccion</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudo cargar la inspeccion")}
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <InspeccionesListado inspeccionesIniciales={data ?? []} />
        )}
      </div>
    </main>
  );
}
