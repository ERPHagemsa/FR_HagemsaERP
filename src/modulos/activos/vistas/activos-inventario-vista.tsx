"use client";

import * as React from "react";
import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";

import { extraerMensajeError } from "@/compartido/api";
import { useConsulta } from "@/compartido/api/use-consulta";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Button } from "@/compartido/componentes/ui/button";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { ActivosTabla } from "../componentes/activos-tabla";
import { obtenerActivosPaginado } from "../servicios/activos-api";

const LIMITE_DEFECTO = 20;

export function ActivosInventarioVista() {
  const [pagina, setPagina] = React.useState(1);
  const [limite, setLimite] = React.useState(LIMITE_DEFECTO);

  const { data, isLoading, isError, error } = useConsulta(
    () => obtenerActivosPaginado({ pagina, limite }),
    [pagina, limite],
  );

  function handleCambiarPagina(nuevaPagina: number) {
    setPagina(nuevaPagina);
  }

  function handleCambiarLimite(nuevoLimite: number) {
    setLimite(nuevoLimite);
    setPagina(1);
  }

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-normal">
              Listar activos
            </h1>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/activos/nuevo">
              <IconPlus />
              Nuevo
            </Link>
          </Button>
        </div>

        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar listado</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(
                error,
                "No se pudo cargar el inventario de activos",
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ActivosTabla
            activos={data?.datos ? [...data.datos] : []}
            paginacionExterna={
              data?.paginacion
                ? {
                    pagina: data.paginacion.pagina,
                    totalPaginas: data.paginacion.totalPaginas,
                    total: data.paginacion.total,
                    tieneSiguiente: data.paginacion.tieneSiguiente,
                    tieneAnterior: data.paginacion.tieneAnterior,
                    onCambiarPagina: handleCambiarPagina,
                    onCambiarLimite: handleCambiarLimite,
                  }
                : undefined
            }
          />
        )}
      </div>
    </main>
  );
}
