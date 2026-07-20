"use client";

import { extraerMensajeError } from "@/compartido/api";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { InspeccionDetallePanel } from "../componentes/inspeccion-detalle-panel";
import { useInspeccionQuery } from "../servicios/inspeccion-queries";

export function InspeccionDetalleVista({ id }: { id: number }) {
  const { data, isLoading, isError, error } = useInspeccionQuery(id);

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
          <Skeleton className="h-96 w-full" />
        ) : data ? (
          <InspeccionDetallePanel inspeccionInicial={data} />
        ) : null}
      </div>
    </main>
  );
}
