"use client";

import Link from "next/link";
import { Info } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/compartido/componentes/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/compartido/componentes/ui/tooltip";

import type { Cotizacion } from "../tipos/cotizaciones.tipos";
import {
  formatearFechaHora,
  formatearOrigenTipo,
} from "../utilidades/formato";

// Diálogo de solo lectura: origen + trazabilidad de la cotización en pares
// label:valor. Es una utilidad de consulta (no muta), por eso vive junto al
// resto de acciones en CotizacionAcciones.
export function DialogDetalles({ cotizacion }: { cotizacion: Cotizacion }) {
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Ver detalles"
            >
              <Info />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Ver detalles</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalles de la cotizacion</DialogTitle>
        </DialogHeader>

        <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          <Grupo titulo="Origen">
            <Campo
              label="Tipo de origen"
              value={formatearOrigenTipo(cotizacion.origenTipo)}
            />
            <Campo label="Razon social" value={cotizacion.origenNombre} />
            <CampoSC cotizacion={cotizacion} />
          </Grupo>

          <Grupo titulo="Trazabilidad">
            <Campo
              label="Ejecutivo responsable"
              value={cotizacion.ejecutivoResponsable.nombre}
            />
            <Campo
              label="Fecha de creacion"
              value={formatearFechaHora(cotizacion.fechaCreacion)}
            />
            <Campo
              label="Ultima modificacion"
              value={
                cotizacion.fechaModificacion
                  ? formatearFechaHora(cotizacion.fechaModificacion)
                  : "—"
              }
            />
          </Grupo>

          {cotizacion.estado === "PERDIDA" && cotizacion.motivoPerdida ? (
            <div className="md:col-span-2">
              <Campo
                label="Motivo de perdida"
                value={cotizacion.motivoPerdida}
              />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Atomos de layout del diálogo
// ---------------------------------------------------------------------------

function Grupo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{titulo}</p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function Campo({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/40 py-1.5 last:border-0">
      <span className="shrink-0 text-xs uppercase text-muted-foreground">
        {label}
      </span>
      <span
        className={mono ? "truncate font-mono text-sm" : "text-sm font-medium"}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function CampoSC({ cotizacion }: { cotizacion: Cotizacion }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/40 py-1.5 last:border-0">
      <span className="shrink-0 text-xs uppercase text-muted-foreground">
        Solicitud de cliente
      </span>
      {cotizacion.solicitudClienteId ? (
        <Button asChild variant="link" size="sm" className="h-auto p-0">
          <Link
            href={`/comercial/solicitudes-cliente/${cotizacion.solicitudClienteId}`}
          >
            Ver SC de origen
          </Link>
        </Button>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      )}
    </div>
  );
}
