"use client";

import { useConsulta } from "@/compartido/api/use-consulta";
import { extraerMensajeError } from "@/compartido/api/formato-error";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { SiteHeader } from "@/compartido/componentes/site-header";
import DetalleVehiculoClient from "../componentes/detalle-vehiculo-client";
import {
  obtenerUnidadPorId,
  obtenerContratosDisponibles,
  obtenerCuentasDisponibles,
} from "../servicios/asignaciones-api";

type Props = {
  id: string;
};

export function VehiculoDetalleVista({ id }: Props) {
  const unidadId = decodeURIComponent(id);
  const { data, isLoading, error } = useConsulta(async () => {
    const [vehiculo, contratosDisponibles, cuentasDisponibles] = await Promise.all([
      obtenerUnidadPorId(unidadId),
      obtenerContratosDisponibles(),
      obtenerCuentasDisponibles(),
    ]);
    return { vehiculo, contratosDisponibles, cuentasDisponibles };
  }, [unidadId]);

  const vehiculo = data?.vehiculo ?? null;
  const contratosDisponibles = data?.contratosDisponibles ?? [];
  const cuentasDisponibles = data?.cuentasDisponibles ?? [];

  return (
    <>
      <SiteHeader
        title={`Unidad ${vehiculo?.placa ?? vehiculo?.placaRodaje ?? unidadId}`}
        breadcrumbs={[
          { title: "Flota y Disponibilidad", href: "/flota" },
          { title: "Listar unidades", href: "/flota/unidades" },
          { title: "Ver" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-6">
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo cargar la unidad</AlertTitle>
              <AlertDescription>{extraerMensajeError(error)}</AlertDescription>
            </Alert>
          ) : (
            <DetalleVehiculoClient
              contratosDisponibles={contratosDisponibles}
              cuentasDisponibles={cuentasDisponibles}
              initialData={vehiculo}
              id={unidadId}
            />
          )}
        </div>
      </main>
    </>
  );
}

export default VehiculoDetalleVista;
