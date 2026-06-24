"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { extraerMensajeError } from "@/compartido/api/formato-error";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Card, CardContent } from "@/compartido/componentes/ui/card";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { CATALOGOS_MAESTROS } from "../componentes/catalogos-maestros.config";
import { HistorialValorCatalogo } from "../componentes/historial-valor-catalogo";
import {
  useHistorialCatalogoQuery,
  useValoresCatalogoQuery,
} from "../servicios/maestros-queries";
import type { TipoCatalogoMaestro } from "../tipos/maestros.tipos";

interface PropsValorCatalogoHistorialVista {
  tipoCatalogo: TipoCatalogoMaestro;
  id: number;
}

export function ValorCatalogoHistorialVista({
  tipoCatalogo,
  id,
}: PropsValorCatalogoHistorialVista) {
  const config = CATALOGOS_MAESTROS.find((c) => c.tipoCatalogo === tipoCatalogo);

  const valores = useValoresCatalogoQuery(tipoCatalogo);
  const item = valores.data?.find((v) => v.id === id) ?? null;

  const historialConsulta = useHistorialCatalogoQuery({ tipoCatalogo, idRegistro: id });
  const historial = historialConsulta.data ?? [];

  if (!config || (!valores.isLoading && !item)) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground">{config?.titulo}</p>
            <h1 className="text-2xl font-semibold tracking-normal">
              {item ? `Historial de "${item.nombre}"` : <Skeleton className="h-7 w-48" />}
            </h1>
            <p className="text-sm text-muted-foreground">
              Auditoria de altas, modificaciones y eliminaciones de este valor de catalogo.
            </p>
            {item ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">ID: {item.id}</Badge>
                <Badge variant={item.estadoRegistro ? "default" : "secondary"}>
                  {item.estadoRegistro ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            ) : null}
          </div>
          <Button variant="outline" asChild>
            <Link href="/activos/maestros">
              <ArrowLeft />
              Volver
            </Link>
          </Button>
        </section>

        <Card>
          <CardContent className="pt-5">
            <p className="mb-3 text-sm font-semibold">Resumen</p>
            {item ? (
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-xs font-medium uppercase text-muted-foreground">
                    Catalogo
                  </dt>
                  <dd className="text-sm font-medium">{config?.titulo}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted-foreground">Nombre</dt>
                  <dd className="text-sm font-medium">{item.nombre}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted-foreground">
                    Descripcion
                  </dt>
                  <dd className="text-sm font-medium">{item.descripcion ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted-foreground">
                    Ultima modificacion
                  </dt>
                  <dd className="text-sm font-medium">
                    {new Date(item.updatedAt).toLocaleString("es-PE")}
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {historialConsulta.error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar el historial</AlertTitle>
            <AlertDescription>{extraerMensajeError(historialConsulta.error)}</AlertDescription>
          </Alert>
        ) : historialConsulta.isLoading ? (
          <Card>
            <CardContent className="flex flex-col gap-3 pt-5">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ) : (
          <HistorialValorCatalogo historial={historial} />
        )}
      </div>
    </main>
  );
}
