"use client";

import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/compartido/componentes/ui/empty";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { extraerMensajeError } from "@/compartido/api";

import type { SolicitudAprobacion } from "../tipos/aprobaciones.tipos";
import { SolicitudEstadoBadge } from "./solicitud-estado-badge";

type Props = {
  historial: SolicitudAprobacion[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
};

export function HistorialAprobaciones({ historial, isLoading, isError, error }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de aprobaciones</CardTitle>
        <CardDescription>Solicitudes de aprobación de esta cotización.</CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar aprobaciones</AlertTitle>
            <AlertDescription>
              {extraerMensajeError(error, "No se pudo cargar el historial de aprobaciones")}
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : historial.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Sin solicitudes de aprobación</EmptyTitle>
              <EmptyDescription>Esta cotización todavía no registra solicitudes.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {historial.map((solicitud) => (
              <article key={solicitud.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Versión {solicitud.numeroVersion}</p>
                    <p className="text-xs text-muted-foreground">
                      Solicitada por {solicitud.usuarioCreacion} · {formatearFechaHora(solicitud.fechaCreacion)}
                    </p>
                  </div>
                  <SolicitudEstadoBadge estado={solicitud.estado} />
                </div>
                <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                  <Dato label="Validez" value={`${solicitud.validezDias} días`} />
                  <Dato
                    label="Resolución"
                    value={
                      solicitud.fechaResolucion
                        ? `${solicitud.usuarioResolucion ?? "—"} · ${formatearFechaHora(solicitud.fechaResolucion)}`
                        : "Pendiente"
                    }
                  />
                  <div className="md:col-span-2">
                    <Dato label="Comentario / motivo" value={solicitud.comentario ?? "—"} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
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
