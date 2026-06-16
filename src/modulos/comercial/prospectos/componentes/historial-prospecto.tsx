"use client";

// Traza de auditoria de UN prospecto (pestaña "Historial" del detalle).
// Carga client-side via useConsulta filtrando por prospectoId. La columna
// "Prospecto" se oculta porque ya estamos dentro de uno.

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription } from "@/compartido/componentes/ui/alert";
import { Spinner } from "@/compartido/componentes/ui/spinner";

import { useHistorialProspectosQuery } from "../servicios/prospectos-queries";
import { HistorialFeed } from "./historial-feed";

type Props = {
  idProspecto: string;
};

export function HistorialProspecto({ idProspecto }: Props) {
  const { data, isLoading, error } = useHistorialProspectosQuery({
    prospectoId: idProspecto,
    porPagina: 50,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        Cargando historial...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {extraerMensajeError(error, "No se pudo cargar el historial")}
        </AlertDescription>
      </Alert>
    );
  }

  return <HistorialFeed entradas={data?.data ?? []} mostrarProspecto={false} />;
}
