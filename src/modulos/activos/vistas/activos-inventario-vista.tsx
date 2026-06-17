import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Button } from "@/compartido/componentes/ui/button";

import { ActivosTabla } from "../componentes/activos-tabla";
import { obtenerActivos } from "../servicios/activos-api-servidor";

export async function ActivosInventarioVista() {
  const resultado = await obtenerActivos({ estadoRegistro: "TODOS" })
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
      <div className="flex w-full flex-col gap-5">
        <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-normal">
              Listar activos
            </h1>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/activos/nuevo">
              <IconPlus />
              Nuevo
            </Link>
          </Button>
        </div>

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
