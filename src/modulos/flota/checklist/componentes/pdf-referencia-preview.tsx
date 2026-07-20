"use client";

import { ExternalLink } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

// Worker de pdf.js servido como estático (copiado de node_modules/pdfjs-dist a
// public/) — evita depender de que el bundler resuelva el asset del worker.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const ANCHO_MINIATURA = 248;

// Renderiza la primera página del PDF de referencia a un <canvas> (via
// pdf.js), sin la UI nativa del visor del navegador — evita las
// inconsistencias de scrollbars/ajuste que tiene un <embed>/<iframe> de PDF.
export function PdfReferenciaPreview({ archivo }: { archivo: string }) {
  const url = `/checklist-referencia/${archivo}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group sticky top-20 flex flex-col gap-2 rounded-lg border border-border bg-card p-2 transition-colors hover:border-primary/40"
    >
      <div className="overflow-hidden rounded-md border border-border/60 bg-muted">
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
      </div>
      <div className="flex items-center justify-between gap-2 px-1 pb-1 text-xs text-muted-foreground group-hover:text-foreground">
        <span>Formato impreso de referencia</span>
        <ExternalLink className="size-3.5 shrink-0" />
      </div>
    </a>
  );
}
