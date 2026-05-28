import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";

import { ProspectosTabla } from "../componentes/prospectos-tabla";
import { listarProspectos } from "../servicios/prospectos-api";
import type { FiltrosProspectos } from "../tipos/prospecto.tipos";

type Props = {
  filtros?: FiltrosProspectos;
  filtrosRaw?: {
    estado?: string;
    idEjecutivoResponsable?: string;
    busqueda?: string;
    pagina?: number;
    porPagina?: number;
  };
};

export async function ProspectosVista({ filtros = {}, filtrosRaw = {} }: Props) {
  const resultado = await listarProspectos(filtros)
    .then((respuesta) => ({ respuesta, error: null }))
    .catch((error: unknown) => ({
      respuesta: null,
      error: extraerMensajeError(error, "No se pudo cargar la lista de prospectos"),
    }));

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-sm font-medium text-muted-foreground">BC-03</p>
          <h1 className="text-2xl font-semibold">Gestion Comercial</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registro y seguimiento de prospectos comerciales.
          </p>
        </section>

        {resultado.error ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar prospectos</AlertTitle>
            <AlertDescription>{resultado.error}</AlertDescription>
          </Alert>
        ) : null}

        {resultado.respuesta ? (
          <ProspectosTabla
            respuesta={resultado.respuesta}
            filtrosActivos={filtrosRaw}
          />
        ) : null}
      </div>
    </main>
  );
}
