"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Printer } from "lucide-react";

import { extraerMensajeError } from "@/compartido/api";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert";
import { Button } from "@/compartido/componentes/ui/button";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { useEtiquetasQuery } from "../servicios/etiquetas-queries";
import type { Etiqueta } from "../tipos/etiquetas.tipos";

/**
 * Hoja de impresion de etiquetas QR. Recibe `?ids=1,2,3` (ids de etiqueta) y
 * renderiza una cuadricula de rotulos listos para imprimir/recortar. El QR se
 * genera en el navegador a partir de `contenidoQr` (no se guarda imagen en BD).
 * Sirve tanto para la impresion inicial del lote como para reimprimir una
 * etiqueta puntual (mismo token = mismo QR, la reimpresion no cambia datos).
 */
export function EtiquetasImprimirVista() {
  const searchParams = useSearchParams();

  const idsSolicitados = useMemo(() => {
    const crudo = searchParams.get("ids") ?? "";
    const ids = crudo
      .split(",")
      .map((parte) => Number(parte.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
    return [...new Set(ids)];
  }, [searchParams]);

  const consulta = useEtiquetasQuery();

  const etiquetas = useMemo(() => {
    const todas = consulta.data ?? [];
    const porId = new Map(todas.map((item) => [item.id, item]));
    return idsSolicitados
      .map((id) => porId.get(id))
      .filter((item): item is Etiqueta => Boolean(item));
  }, [consulta.data, idsSolicitados]);

  const idsNoEncontrados = useMemo(() => {
    if (consulta.isLoading || consulta.data === null) return [];
    const encontrados = new Set(etiquetas.map((item) => item.id));
    return idsSolicitados.filter((id) => !encontrados.has(id));
  }, [idsSolicitados, etiquetas, consulta.isLoading, consulta.data]);

  return (
    <main className="min-h-screen bg-muted/20 px-4 py-5 text-foreground print:bg-white print:p-0 lg:px-7">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 print:max-w-none print:gap-0">
        <section className="flex flex-col gap-3 border-b border-border pb-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Imprimir etiquetas QR</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {etiquetas.length}{" "}
              {etiquetas.length === 1
                ? "etiqueta lista para imprimir."
                : "etiquetas listas para imprimir."}{" "}
              Usa la vista previa de impresion del navegador para elegir la
              impresora y el tamano de papel.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/activos/etiquetas">
                <ArrowLeft />
                Volver al maestro
              </Link>
            </Button>
            <Button
              onClick={() => window.print()}
              disabled={etiquetas.length === 0}
            >
              <Printer />
              Imprimir
            </Button>
          </div>
        </section>

        {consulta.error ? (
          <Alert variant="destructive" className="print:hidden">
            <AlertTitle>No se pudieron cargar las etiquetas</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(consulta.error)}
            </AlertDescription>
          </Alert>
        ) : null}

        {idsNoEncontrados.length > 0 ? (
          <Alert className="print:hidden">
            <AlertTitle>Algunas etiquetas no se encontraron</AlertTitle>
            <AlertDescription>
              Ids sin coincidencia: {idsNoEncontrados.join(", ")}. Se imprimen
              solo las encontradas.
            </AlertDescription>
          </Alert>
        ) : null}

        {consulta.isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full" />
            ))}
          </div>
        ) : etiquetas.length === 0 ? (
          <div className="flex h-40 items-center justify-center border border-dashed border-border text-muted-foreground print:hidden">
            {idsSolicitados.length === 0
              ? "No se indico ninguna etiqueta. Selecciona etiquetas en el maestro y usa Imprimir."
              : "Ninguna de las etiquetas solicitadas existe."}
          </div>
        ) : (
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3 print:gap-0">
            {etiquetas.map((item) => (
              <article
                key={item.id}
                className="flex flex-col items-center gap-2 border border-dashed border-border bg-white p-4 text-center print:break-inside-avoid print:border-neutral-300"
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  HAGEMSA · Activos
                </span>
                <QRCodeSVG
                  value={item.contenidoQr}
                  size={140}
                  level="M"
                  marginSize={1}
                  className="h-auto w-full max-w-[150px]"
                />
                <span className="font-mono text-lg font-bold tracking-wide text-neutral-900">
                  {item.codigo}
                </span>
                {item.activo ? (
                  <span className="font-mono text-xs text-neutral-600">
                    {item.activo.codigo}
                  </span>
                ) : null}
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
