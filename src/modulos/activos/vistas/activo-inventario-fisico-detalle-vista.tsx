"use client";

import { extraerMensajeError } from "@/compartido/api";
import { useConsulta } from "@/compartido/api/use-consulta";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { InventarioFisicoDetallePanel } from "../componentes/inventario-fisico-detalle-panel";
import {
  obtenerActivos,
  obtenerInventarioFisicoPorId,
} from "../servicios/activos-api";

export function ActivoInventarioFisicoDetalleVista({
  id,
  activo,
}: {
  id: number;
  activo?: string;
}) {
  const { data, isLoading, isError, error } = useConsulta(async () => {
    const [inventario, activosMaestro] = await Promise.all([
      obtenerInventarioFisicoPorId(id),
      obtenerActivos({ estadoRegistro: true }),
    ]);
    return { inventario, activosMaestro };
  }, [id]);

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar revision</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(
                error,
                "No se pudo cargar la revision de inventario",
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : data?.inventario ? (
          <InventarioFisicoDetallePanel
            inventarioInicial={data.inventario}
            activosMaestro={data.activosMaestro}
            activoInicial={activo}
          />
        ) : null}
      </div>
    </main>
  );
}
