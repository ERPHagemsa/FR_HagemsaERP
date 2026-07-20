"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/compartido/componentes/ui/empty";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { extraerMensajeError } from "@/compartido/api";
import { formatearFechaHora } from "@/modulos/comercial/utilidades/formato-fecha";

import type { SolicitudAprobacion } from "../tipos/aprobaciones.tipos";
import { SolicitudEstadoBadge } from "./solicitud-estado-badge";

type Props = {
  historial: SolicitudAprobacion[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
};

// Solo el cuerpo del historial (estados + timeline). El título/descripción los
// aporta el contenedor —hoy el diálogo del smart button "Aprobaciones"—.
export function HistorialAprobaciones({
  historial,
  isLoading,
  isError,
  error,
}: Props) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar aprobaciones</AlertTitle>
        <AlertDescription>
          {extraerMensajeError(
            error,
            "No se pudo cargar el historial de aprobaciones",
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Sin solicitudes de aprobación</EmptyTitle>
          <EmptyDescription>
            Esta cotización todavía no registra solicitudes.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {historial.map((solicitud) => (
        <article
          key={solicitud.id}
          className="rounded-xl border border-border p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">
                Versión {solicitud.numeroVersion}
              </p>
              <p className="text-xs text-muted-foreground">
                Solicitada por {solicitud.nombreUsuarioCreacion} ·{" "}
                {formatearFechaHora(solicitud.fechaCreacion)}
              </p>
            </div>
            <SolicitudEstadoBadge estado={solicitud.estado} />
          </div>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            <Dato label="Validez" value={`${solicitud.validezDias} días`} />
            <Dato
              label="Resolución"
              value={
                // `nombreUsuarioResolucion` es un snapshot del nombre al
                // momento de resolver: se muestra tal cual, sin consultar
                // al BC de auth. Es null mientras sigue EN_APROBACION.
                solicitud.fechaResolucion
                  ? `${solicitud.nombreUsuarioResolucion ?? "—"} · ${formatearFechaHora(solicitud.fechaResolucion)}`
                  : "Pendiente"
              }
            />
            <div className="md:col-span-2">
              <Dato
                label="Comentario / motivo"
                value={solicitud.comentario ?? "—"}
              />
            </div>
          </div>
        </article>
      ))}
    </div>
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
