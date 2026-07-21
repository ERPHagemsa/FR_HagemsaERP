"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

import { extraerMensajeError } from "@/compartido/api/formato-error";
import { obtenerVistaPreviaVersionPdf } from "@/modulos/flota/checklist/servicios/checklist-api";

// Worker de pdf.js servido como estático (copiado de node_modules/pdfjs-dist a
// public/) — evita depender de que el bundler resuelva el asset del worker.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const ANCHO_MINIATURA = 248;

// Genera y muestra la primera página del PDF de la versión ACTUAL (mismo
// motor de impresión que una inspección real, en blanco). Reemplaza al PDF
// de referencia estático: refleja ediciones reales tras cada guardado, en
// vez de un documento fijo que puede quedar desactualizado respecto al
// formato que realmente se imprime.
//
// `dependencia` fuerza un refetch cuando cambia (pasar la referencia de
// `secciones`/`version` recién refetcheada tras un guardado exitoso).
export function PdfVistaPreviaVersion({
  versionId,
  dependencia,
}: {
  versionId: number;
  dependencia?: unknown;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    let urlCreada: string | null = null;

    setCargando(true);
    setError(null);
    obtenerVistaPreviaVersionPdf(versionId)
      .then((blob) => {
        if (cancelado) return;
        urlCreada = URL.createObjectURL(blob);
        setUrl(urlCreada);
      })
      .catch((err) => {
        if (!cancelado) setError(extraerMensajeError(err, "No se pudo generar la vista previa."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
      if (urlCreada) URL.revokeObjectURL(urlCreada);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionId, dependencia]);

  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="group sticky top-20 flex flex-col gap-2 rounded-lg border border-border bg-card p-2 transition-colors hover:border-primary/40"
      onClick={(e) => {
        if (!url) e.preventDefault();
      }}
    >
      <div className="overflow-hidden rounded-md border border-border/60 bg-muted">
        {cargando ? (
          <div
            className="flex items-center justify-center text-xs text-muted-foreground"
            style={{ width: ANCHO_MINIATURA, aspectRatio: "3 / 4" }}
          >
            <Loader2 className="mr-2 size-4 animate-spin" />
            Generando…
          </div>
        ) : error ? (
          <div
            className="flex items-center justify-center px-2 text-center text-xs text-destructive"
            style={{ width: ANCHO_MINIATURA, aspectRatio: "3 / 4" }}
          >
            {error}
          </div>
        ) : (
          <Document
            file={url}
            loading={
              <div
                className="flex items-center justify-center text-xs text-muted-foreground"
                style={{ width: ANCHO_MINIATURA, aspectRatio: "3 / 4" }}
              >
                Cargando…
              </div>
            }
            error={
              <div
                className="flex items-center justify-center text-xs text-muted-foreground"
                style={{ width: ANCHO_MINIATURA, aspectRatio: "3 / 4" }}
              >
                No se pudo previsualizar
              </div>
            }
          >
            <Page
              pageNumber={1}
              width={ANCHO_MINIATURA}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-1 pb-1 text-xs text-muted-foreground group-hover:text-foreground">
        <span>Vista previa (formulario en blanco)</span>
        <ExternalLink className="size-3.5 shrink-0" />
      </div>
    </a>
  );
}
