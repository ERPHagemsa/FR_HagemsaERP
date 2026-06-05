import { extraerMensajeError } from "@/compartido/api";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert";

import { InventarioFisicoDetallePanel } from "../componentes/inventario-fisico-detalle-panel";
import { obtenerInventarioFisicoPorId } from "../servicios/activos-api";

export async function ActivoInventarioFisicoDetalleVista({
  id,
}: {
  id: number;
}) {
  const resultado = await obtenerInventarioFisicoPorId(id)
    .then((inventario) => ({ inventario, error: null }))
    .catch((error: unknown) => ({
      inventario: null,
      error: extraerMensajeError(
        error,
        "No se pudo cargar la revision de inventario"
      ),
    }));

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        {resultado.error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar revision</AlertTitle>
            <AlertDescription>{resultado.error}</AlertDescription>
          </Alert>
        ) : null}

        {resultado.inventario ? (
          <InventarioFisicoDetallePanel
            inventarioInicial={resultado.inventario}
          />
        ) : null}
      </div>
    </main>
  );
}
