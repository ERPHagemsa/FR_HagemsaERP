import { extraerMensajeError } from "@/compartido/api";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert";

import { InventariosFisicosListado } from "../componentes/inventarios-fisicos-listado";
import { obtenerInventariosFisicos } from "../servicios/activos-api-servidor";

export async function ActivosInventarioFisicoVista() {
  const resultado = await obtenerInventariosFisicos()
    .then((inventarios) => ({ inventarios, error: null }))
    .catch((error: unknown) => ({
      inventarios: [],
      error: extraerMensajeError(
        error,
        "No se pudo cargar el inventario fisico"
      ),
    }));

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        {resultado.error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar inventario fisico</AlertTitle>
            <AlertDescription>{resultado.error}</AlertDescription>
          </Alert>
        ) : null}

        <InventariosFisicosListado
          inventariosIniciales={resultado.inventarios}
        />
      </div>
    </main>
  );
}
