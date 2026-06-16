import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";

import { HistorialProspectosTabla } from "../componentes/historial-prospectos-tabla";
import { obtenerHistorialProspectos } from "../servicios/prospectos-api";
import type { FiltrosHistorial } from "../tipos/prospecto.tipos";

type Props = {
  filtros?: FiltrosHistorial;
  filtrosRaw?: {
    accion?: string;
    desde?: string;
    hasta?: string;
    pagina?: number;
    porPagina?: number;
  };
};

export async function HistorialProspectosVista({
  filtros = {},
  filtrosRaw = {},
}: Props) {
  const resultado = await obtenerHistorialProspectos(filtros)
    .then((respuesta) => ({ respuesta, error: null }))
    .catch((error: unknown) => ({
      respuesta: null,
      error: extraerMensajeError(error, "No se pudo cargar el historial"),
    }));

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        {resultado.error ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar el historial</AlertTitle>
            <AlertDescription>{resultado.error}</AlertDescription>
          </Alert>
        ) : null}

        {resultado.respuesta ? (
          <HistorialProspectosTabla
            respuesta={resultado.respuesta}
            filtrosActivos={filtrosRaw}
          />
        ) : null}
      </div>
    </main>
  );
}
