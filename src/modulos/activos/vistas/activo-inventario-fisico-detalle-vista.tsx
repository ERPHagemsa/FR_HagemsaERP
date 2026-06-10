import { extraerMensajeError } from "@/compartido/api";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert";

import { InventarioFisicoDetallePanel } from "../componentes/inventario-fisico-detalle-panel";
import {
  obtenerActivos,
  obtenerInventarioFisicoPorId,
} from "../servicios/activos-api";

export async function ActivoInventarioFisicoDetalleVista({
  id,
}: {
  id: number;
}) {
  const resultado = await Promise.all([
    obtenerInventarioFisicoPorId(id),
    obtenerActivos({ estadoRegistro: true }),
  ])
    .then(([inventario, activosMaestro]) => ({
      inventario,
      activosMaestro,
      error: null,
    }))
    .catch((error: unknown) => ({
      inventario: null,
      activosMaestro: [],
      error: extraerMensajeError(
        error,
        "No se pudo cargar la revision de inventario"
      ),
    }));

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        {resultado.error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar revision</AlertTitle>
            <AlertDescription>{resultado.error}</AlertDescription>
          </Alert>
        ) : null}

        {resultado.inventario ? (
          <InventarioFisicoDetallePanel
            inventarioInicial={resultado.inventario}
            activosMaestro={resultado.activosMaestro}
          />
        ) : null}
      </div>
    </main>
  );
}
