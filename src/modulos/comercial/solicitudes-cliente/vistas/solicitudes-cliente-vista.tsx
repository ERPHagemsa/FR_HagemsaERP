import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";

import { SolicitudesClienteTabla } from "../componentes/solicitudes-cliente-tabla";
import { listarSolicitudesCliente } from "../servicios/solicitudes-cliente-api";
import type { FiltrosSolicitudesCliente } from "../tipos/solicitud-cliente.tipos";

type Props = {
  filtros?: FiltrosSolicitudesCliente;
};

export async function SolicitudesClienteVista({ filtros = {} }: Props) {
  const resultado = await listarSolicitudesCliente(filtros)
    .then((respuesta) => ({ respuesta, error: null }))
    .catch((error: unknown) => ({
      respuesta: null,
      error: extraerMensajeError(
        error,
        "No se pudo cargar la lista de solicitudes de cliente"
      ),
    }));

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        {resultado.error ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar solicitudes</AlertTitle>
            <AlertDescription>{resultado.error}</AlertDescription>
          </Alert>
        ) : null}

        {resultado.respuesta ? (
          <SolicitudesClienteTabla
            items={resultado.respuesta.data}
            filtros={filtros}
            total={resultado.respuesta.total}
          />
        ) : null}
      </div>
    </main>
  );
}
