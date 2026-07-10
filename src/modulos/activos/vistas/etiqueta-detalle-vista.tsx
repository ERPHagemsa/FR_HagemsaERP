"use client";

import { useRef } from "react";
import Link from "next/link";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Printer } from "lucide-react";
import { toast } from "sonner";

import { extraerMensajeError } from "@/compartido/api/formato-error";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Card, CardContent } from "@/compartido/componentes/ui/card";
import { Separator } from "@/compartido/componentes/ui/separator";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import type { Etiqueta, EstadoEtiqueta } from "../tipos/etiquetas.tipos";
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

function escaparHtml(texto: string): string {
  const contenedor = document.createElement("div");
  contenedor.textContent = texto;
  return contenedor.innerHTML;
}

// Imprime en una ventana aparte, aislada del layout del dashboard (que usa
// overflow-hidden en el shell y recorta cualquier truco de CSS @media print
// hecho dentro de la misma pagina). El QR ocupa casi toda la hoja: pensado
// para imprimir y pegar en la unidad, no para leer en pantalla.
function imprimirEtiqueta(etiqueta: Etiqueta, canvas: HTMLCanvasElement | null) {
  const dataUrl = canvas?.toDataURL("image/png") ?? "";
  const ventana = window.open("", "_blank", "width=480,height=640");
  if (!ventana) {
    toast.error("No se pudo abrir la ventana de impresion", {
      description: "El navegador bloqueo la ventana emergente. Permite popups para este sitio e intenta de nuevo.",
    });
    return;
  }

  const activoHtml = etiqueta.activo
    ? `<div class="activo">${escaparHtml(etiqueta.activo.codigo)} &middot; ${escaparHtml(etiqueta.activo.descripcion)}</div>`
    : "";

  ventana.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>${escaparHtml(etiqueta.codigo)}</title>
    <style>
      * { box-sizing: border-box; }
      @page { margin: 1.2cm; }
      html, body { height: 100%; }
      body {
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        font-family: system-ui, sans-serif;
        gap: 20px;
        text-align: center;
      }
      .marca {
        font-size: 16px;
        font-weight: 800;
        letter-spacing: 6px;
        color: #b91c1c;
        text-transform: uppercase;
      }
      img {
        width: min(82vw, 82vh);
        height: min(82vw, 82vh);
      }
      .codigo {
        font-size: clamp(28px, 6vw, 64px);
        font-weight: 800;
        letter-spacing: 2px;
      }
      .activo { font-size: 18px; color: #444; }
    </style>
  </head>
  <body>
    <div class="marca">Hagemsa</div>
    <img src="${dataUrl}" alt="${escaparHtml(etiqueta.codigo)}" />
    ${activoHtml}
  </body>
</html>`);
  ventana.document.close();

  ventana.onload = () => {
    ventana.focus();
    ventana.print();
  };
}

export function EtiquetaDetalleVista({ id }: { id: number }) {
  const consulta = useEtiquetaQuery(id);
  const etiqueta = consulta.data;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full max-w-3xl flex-col gap-5">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href="/activos/etiquetas">
              <ArrowLeft />
              Volver al listado
            </Link>
          </Button>
          {etiqueta ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => imprimirEtiqueta(etiqueta, canvasRef.current)}
            >
              <Printer />
              Imprimir QR
            </Button>
          ) : null}
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
                  {/* Copia oculta en canvas: solo sirve para generar el PNG de la ventana de impresion. */}
                  <QRCodeCanvas
                    ref={canvasRef}
                    value={etiqueta.contenidoQr}
                    size={800}
                    className="hidden"
                  />
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
