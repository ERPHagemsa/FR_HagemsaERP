"use client";

import { useParams } from "next/navigation";

import { useConsulta } from "@/compartido/api/use-consulta";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import {
  obtenerHistorialPorId,
  obtenerUnidadPorId,
} from "@/modulos/flota/asignaciones/servicios/asignaciones-api";
import { FlotaAuditoriaVista } from "@/modulos/flota/asignaciones/vistas/flota-auditoria-vista";

export default function FlotaAuditoriaPage() {
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
    <FlotaAuditoriaVista
      id={unidadId}
      placa={data?.vehiculo?.placa ?? data?.vehiculo?.placaRodaje ?? null}
      historial={data?.res?.datos ?? []}
    />
  );
}
