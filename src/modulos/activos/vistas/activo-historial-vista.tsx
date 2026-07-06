"use client";

import Link from "next/link";
import { notFound } from "next/navigation";

import { useConsulta } from "@/compartido/api/use-consulta";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { HistorialActivo } from "../componentes/historial-activo";
import {
  obtenerActivoPorCodigo,
  obtenerConfiguracionHistoricaPorCodigo,
  obtenerHistorialPorCodigo,
} from "../servicios/activos-api";

type Props = {
  codigo: string;
};

export function ActivoHistorialVista({ codigo }: Props) {
  const { data, isLoading } = useConsulta(async () => {
    const [activo, historial, configuracion] = await Promise.all([
      obtenerActivoPorCodigo(codigo).catch(() => null),
      obtenerHistorialPorCodigo(codigo).catch(() => []),
      obtenerConfiguracionHistoricaPorCodigo(codigo).catch(() => []),
    ]);
    return { activo, historial, configuracion };
  }, [codigo]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const activo = data?.activo ?? null;
  const historial = data?.historial ?? [];
  const configuracionHistorica = data?.configuracion ?? [];
  const ultimaConfiguracionHistorica = configuracionHistorica[0];

  if (!activo) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        <section className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              {activo.codigo}
            </p>
            <h1 className="text-2xl font-semibold tracking-normal">
              Historial y auditoria
            </h1>
            <p className="text-sm text-muted-foreground">
              {activo.descripcion}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">ID inventario: {activo.id}</Badge>
              <Badge>{activo.estadoActivo}</Badge>
              {activo.estadoRegistro === false ? (
                <Badge variant="destructive">Registro anulado</Badge>
              ) : null}
              {ultimaConfiguracionHistorica ? (
                <Badge
                  className="border-primary/30 bg-primary/10 text-primary"
                  variant="outline"
                >
                  {formatearTipoConfiguracion(
                    ultimaConfiguracionHistorica.tipoCambio
                  )}
                  :{" "}
                  {ultimaConfiguracionHistorica.placaAnterior
                    ? `placa anterior ${ultimaConfiguracionHistorica.placaAnterior}`
                    : ultimaConfiguracionHistorica.codigoAnterior
                      ? `codigo anterior ${ultimaConfiguracionHistorica.codigoAnterior}`
                      : `ID anterior ${activo.activoOrigenId ?? "-"}`}
                </Badge>
              ) : activo.activoOrigenId ? (
                <Badge
                  className="border-primary/30 bg-primary/10 text-primary"
                  variant="outline"
                >
                  ID anterior {activo.activoOrigenId}
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/activos">Volver</Link>
            </Button>
            <Button asChild>
              <Link href={`/activos/${activo.codigo}`}>Ver ficha</Link>
            </Button>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Resumen del activo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Dato label="Codigo" value={activo.codigo} />
              <Dato label="Unidad" value={activo.descripcion} />
              <Dato label="Ubicacion" value={activo.ubicacion} />
              <Dato label="Ultima modificacion" value={formatearFechaHora(activo.fechaModificacion)} />
            </div>
          </CardContent>
        </Card>

        <HistorialActivo
          configuraciones={configuracionHistorica}
          historial={historial}
        />
      </div>
    </main>
  );
}

function Dato({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </span>
      <span className="font-medium">{value ?? "-"}</span>
    </div>
  );
}

function formatearFechaHora(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatearTipoConfiguracion(value: string) {
  const labels: Record<string, string> = {
    REPOTENCIACION: "Repotenciacion",
    CAMBIO_CARROCERIA: "Cambio de carroceria",
    CAMBIO_PLACA: "Replaqueo",
    REMOLCAMIENTO: "Remolcamiento",
    MEJORA_ESTRUCTURAL: "Mejora estructural",
    RENOVACION: "Renovacion",
    OTRO: "Configuracion historica",
  };

  return labels[value] ?? value.replaceAll("_", " ").toLowerCase();
}
