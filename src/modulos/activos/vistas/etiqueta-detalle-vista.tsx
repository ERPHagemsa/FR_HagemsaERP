"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft } from "lucide-react";

import { extraerMensajeError } from "@/compartido/api/formato-error";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Card, CardContent } from "@/compartido/componentes/ui/card";
import { Separator } from "@/compartido/componentes/ui/separator";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import type { EstadoEtiqueta } from "../tipos/etiquetas.tipos";
import { useEtiquetaQuery } from "../servicios/etiquetas-queries";

const ETIQUETAS_BADGE_VARIANTE: Record<
  EstadoEtiqueta,
  "default" | "secondary" | "destructive" | "outline"
> = {
  GENERADA: "outline",
  ASIGNADA: "default",
  REEMPLAZADA: "secondary",
  ANULADA: "destructive",
};

const ETIQUETAS_BADGE_TEXTO: Record<EstadoEtiqueta, string> = {
  GENERADA: "Generada",
  ASIGNADA: "Asignada",
  REEMPLAZADA: "Reemplazada",
  ANULADA: "Anulada",
};

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{etiqueta}</span>
      <span className="text-sm">{valor}</span>
    </div>
  );
}

export function EtiquetaDetalleVista({ id }: { id: number }) {
  const consulta = useEtiquetaQuery(id);
  const etiqueta = consulta.data;

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full max-w-3xl flex-col gap-5">
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/activos/etiquetas">
              <ArrowLeft />
              Volver al listado
            </Link>
          </Button>
        </div>

        {consulta.isLoading ? (
          <Card>
            <CardContent className="pt-5">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ) : consulta.error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar la etiqueta</AlertTitle>
            <AlertDescription>{extraerMensajeError(consulta.error)}</AlertDescription>
          </Alert>
        ) : etiqueta ? (
          <Card>
            <CardContent className="flex flex-col gap-5 pt-5">
              <div className="flex flex-col items-start gap-5 sm:flex-row">
                <div className="rounded-lg border border-border bg-white p-3">
                  <QRCodeSVG value={etiqueta.contenidoQr} size={160} />
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold">{etiqueta.codigo}</h1>
                    <Badge variant={ETIQUETAS_BADGE_VARIANTE[etiqueta.estado]}>
                      {ETIQUETAS_BADGE_TEXTO[etiqueta.estado]}
                    </Badge>
                  </div>
                  <span className="text-xs break-all text-muted-foreground">
                    {etiqueta.contenidoQr}
                  </span>
                  {etiqueta.activo ? (
                    <div className="rounded-lg border border-border bg-muted/40 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Activo asignado
                      </p>
                      <p className="text-sm font-semibold">{etiqueta.activo.codigo}</p>
                      <p className="text-sm text-muted-foreground">
                        {etiqueta.activo.descripcion}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                      Sin asignacion. El enlace a un activo se hace desde el proceso de
                      asignacion (proximamente).
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Campo etiqueta="Token" valor={etiqueta.token} />
                <Campo
                  etiqueta="Observacion"
                  valor={etiqueta.observacion ?? "—"}
                />
                <Campo
                  etiqueta="Creado"
                  valor={new Date(etiqueta.fechaCreacion).toLocaleString("es-PE")}
                />
                <Campo
                  etiqueta="Modificado"
                  valor={new Date(etiqueta.fechaModificacion).toLocaleString("es-PE")}
                />
                {etiqueta.fechaAsignacion ? (
                  <Campo
                    etiqueta="Fecha de asignacion"
                    valor={new Date(etiqueta.fechaAsignacion).toLocaleString("es-PE")}
                  />
                ) : null}
                {etiqueta.usuarioAsignacion ? (
                  <Campo etiqueta="Usuario de asignacion" valor={etiqueta.usuarioAsignacion} />
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
