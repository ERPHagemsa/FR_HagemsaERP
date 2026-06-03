import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";

import { CotizacionesTabla } from "../componentes/cotizaciones-tabla";
import { listarCotizaciones } from "../servicios/cotizaciones-api";
import type { FiltrosCotizaciones } from "../tipos/cotizaciones.tipos";

type Props = {
  filtros?: FiltrosCotizaciones;
  filtrosRaw?: {
    estado?: string;
    origenTipo?: string;
    busqueda?: string;
    pagina?: number;
    porPagina?: number;
  };
};

export async function CotizacionesVista({
  filtros = {},
  filtrosRaw = {},
}: Props) {
  const resultado = await listarCotizaciones(filtros)
    .then((respuesta) => ({ respuesta, error: null }))
    .catch((error: unknown) => ({
      respuesta: null,
      error: extraerMensajeError(
        error,
        "No se pudo cargar la lista de cotizaciones"
      ),
    }));

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        {resultado.error ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar cotizaciones</AlertTitle>
            <AlertDescription>{resultado.error}</AlertDescription>
          </Alert>
        ) : null}

        {resultado.respuesta ? (
          <CotizacionesTabla
            respuesta={resultado.respuesta}
            filtrosActivos={filtrosRaw}
          />
        ) : null}
      </div>
    </main>
  );
}
