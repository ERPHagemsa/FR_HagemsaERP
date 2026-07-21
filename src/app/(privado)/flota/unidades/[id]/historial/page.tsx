"use client";

import { useParams } from "next/navigation";

import { useConsulta } from "@/compartido/api/use-consulta";
import { extraerMensajeError } from "@/compartido/api/formato-error";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import {
  obtenerHistorialPorId,
  obtenerUnidadPorId,
} from "@/modulos/flota/asignaciones/servicios/asignaciones-api";
import { FlotaHistorialVista } from "@/modulos/flota/asignaciones/vistas/flota-historial-vista";

export default function FlotaHistorialPage() {
  const params = useParams<{ id: string }>();
  const unidadId = params.id;

  const { data, isLoading, error } = useConsulta(async () => {
    const [res, vehiculo] = await Promise.all([
      obtenerHistorialPorId(unidadId),
      obtenerUnidadPorId(unidadId),
    ]);
    return { res, vehiculo };
  }, [unidadId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el historial</AlertTitle>
          <AlertDescription>{extraerMensajeError(error)}</AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <FlotaHistorialVista
      id={unidadId}
      placa={data?.vehiculo?.placa ?? data?.vehiculo?.placaRodaje ?? null}
      historial={data?.res?.datos ?? []}
    />
  );
}
