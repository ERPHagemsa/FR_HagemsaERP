import Link from "next/link";

import { Button } from "@/compartido/componentes/ui/button";
import { ActivoFormulario } from "../componentes/activo-formulario";
import { obtenerActivoPorCodigo } from "../servicios/activos-api";

type Props = {
  codigo: string;
};

export async function ActivoEditarVista({ codigo }: Props) {
  const activo = await obtenerActivoPorCodigo(codigo);

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Modificar</p>
            <h1 className="text-2xl font-semibold">{activo.codigo}</h1>
          </div>
          <Button asChild variant="outline">
            <Link href={`/activos/${activo.codigo}`}>Volver</Link>
          </Button>
        </section>

        <ActivoFormulario activo={activo} modo="editar" />
      </div>
    </main>
  );
}
