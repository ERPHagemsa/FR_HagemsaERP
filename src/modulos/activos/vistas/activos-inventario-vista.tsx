import { IconClipboardList } from "@tabler/icons-react";

import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";

import { ActivosInventarioListado } from "../componentes/activos-inventario-listado";
import { obtenerActivos } from "../servicios/activos-api";

export async function ActivosInventarioVista() {
  const resultado = await obtenerActivos()
    .then((activos) => ({ activos, error: null }))
    .catch((error: unknown) => ({
      activos: [],
      error:
        error instanceof Error
          ? error.message
          : "No se pudo cargar el inventario de activos",
    }));

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-600">
              <IconClipboardList className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-600">BC-02</p>
              <h1 className="text-2xl font-semibold">Inventario de activos</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Listado detallado para consultar ID inventario, datos tecnicos,
                estados y trazabilidad visible.
              </p>
            </div>
          </div>
        </section>

        {resultado.error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar inventario</AlertTitle>
            <AlertDescription>{resultado.error}</AlertDescription>
          </Alert>
        ) : null}

        <ActivosInventarioListado activos={resultado.activos} />
      </div>
    </main>
  );
}
