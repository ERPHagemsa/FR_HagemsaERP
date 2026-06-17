"use client";

import { extraerMensajeError } from "@/compartido/api";
import { useConsulta } from "@/compartido/api/use-consulta";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { InventariosFisicosListado } from "../componentes/inventarios-fisicos-listado";
import { obtenerInventariosFisicos } from "../servicios/activos-api";

export function ActivosInventarioFisicoVista() {
  const { data, isLoading, isError, error } = useConsulta(
    () => obtenerInventariosFisicos(),
    [],
  );

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar inventario fisico</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(
                error,
                "No se pudo cargar el inventario fisico",
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <InventariosFisicosListado inventariosIniciales={data ?? []} />
        )}
      </div>
    </main>
  );
}
