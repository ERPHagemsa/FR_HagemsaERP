import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";

import { ActivosTabla } from "../componentes/activos-tabla";
import { obtenerActivos } from "../servicios/activos-api";

export async function ActivosInventarioVista() {
  const resultado = await obtenerActivos()
    .then((activos) => ({ activos, error: null }))
    .catch((error: unknown) => ({
      activos: [],
      error: extraerMensajeError(
        error,
        "No se pudo cargar el inventario de activos",
      ),
    }));

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        {resultado.error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar listado</AlertTitle>
            <AlertDescription>{resultado.error}</AlertDescription>
          </Alert>
        ) : null}

        <ActivosTabla activos={resultado.activos} />
      </div>
    </main>
  );
}
