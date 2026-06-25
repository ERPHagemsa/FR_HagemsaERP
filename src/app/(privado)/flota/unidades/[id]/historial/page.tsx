"use client";

import { useParams } from "next/navigation";

import { useConsulta } from "@/compartido/api/use-consulta";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import {
  obtenerHistorialPorId,
  obtenerUnidadPorId,
} from "@/modulos/flota/servicios/flota-api";
import { FlotaHistorialVista } from "@/modulos/flota/vistas/flota-historial-vista";

export default function FlotaHistorialPage() {
  const params = useParams<{ id: string }>();
  const unidadId = params.id;

  const { data, isLoading } = useConsulta(async () => {
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

  return (
    <FlotaHistorialVista
      id={unidadId}
      placa={data?.vehiculo?.placa ?? data?.vehiculo?.placaRodaje ?? null}
      historial={data?.res?.datos ?? []}
    />
  );
}
