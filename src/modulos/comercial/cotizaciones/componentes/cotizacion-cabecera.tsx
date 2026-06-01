import {
  Card,
  CardContent,
  CardHeader,
} from "@/compartido/componentes/ui/card";
import { Separator } from "@/compartido/componentes/ui/separator";

import type { Cotizacion } from "../tipos/cotizaciones.tipos";
import { EstadoCotizacionBadge } from "./estado-cotizacion-badge";

type Props = {
  cotizacion: Cotizacion;
};

export function CotizacionCabecera({ cotizacion }: Props) {
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-muted-foreground">
              Cotizacion
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">
                {cotizacion.origenTipo === "PROSPECTO" ? "Prospecto" : "Cliente"}
              </h1>
              <EstadoCotizacionBadge estado={cotizacion.estado} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Dato label="Origen" value={formatearOrigenTipo(cotizacion.origenTipo)} />
          <Dato label="ID origen" value={cotizacion.origenId} mono />
          <Dato label="Canal de entrada" value={formatearCanal(cotizacion.canalEntrada)} />
          <Dato label="Ejecutivo responsable" value={cotizacion.idEjecutivoResponsable} />
          {cotizacion.solicitudClienteId ? (
            <Dato label="Solicitud de cliente" value={cotizacion.solicitudClienteId} mono />
          ) : null}
          {cotizacion.estado === "PERDIDA" && cotizacion.motivoPerdida ? (
            <>
              <div className="col-span-full">
                <Separator className="my-1" />
              </div>
              <div className="col-span-full">
                <Dato label="Motivo de perdida" value={cotizacion.motivoPerdida} />
              </div>
            </>
          ) : null}
        </div>

        <Separator className="my-4" />

        <div className="grid gap-4 md:grid-cols-2">
          <Dato label="Fecha de creacion" value={formatearFechaHora(cotizacion.fechaCreacion)} />
          <Dato
            label="Ultima modificacion"
            value={
              cotizacion.fechaModificacion
                ? formatearFechaHora(cotizacion.fechaModificacion)
                : "—"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Dato({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </span>
      <span className={mono ? "truncate font-mono text-sm font-medium" : "font-medium"}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function formatearOrigenTipo(tipo: string) {
  return tipo === "PROSPECTO" ? "Prospecto" : tipo === "CLIENTE" ? "Cliente" : tipo;
}

function formatearCanal(canal: string) {
  const mapa: Record<string, string> = {
    CORREO: "Correo",
    LLAMADA: "Llamada",
    PRESENCIAL: "Presencial",
    OTRO: "Otro",
  };
  return mapa[canal] ?? canal;
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
