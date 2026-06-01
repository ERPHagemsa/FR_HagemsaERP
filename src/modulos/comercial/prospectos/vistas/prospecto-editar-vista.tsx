import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/compartido/componentes/ui/button";

import { ProspectoFormulario } from "../componentes/prospecto-formulario";
import { consultarProspecto } from "../servicios/prospectos-api";

type Props = {
  id: string;
};

export async function ProspectoEditarVista({ id }: Props) {
  const prospecto = await consultarProspecto(id).catch(() => null);

  if (!prospecto) {
    notFound();
  }

  // REQ-9.1 / REQ-12.3: estado terminal → redirigir al detalle con aviso
  if (prospecto.estado !== "ACTIVO") {
    redirect(`/comercial/prospectos/${id}?accion=bloqueado`);
  }

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <section className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Prospecto #{prospecto.id}
            </p>
            <h1 className="text-2xl font-semibold">
              Editar — {prospecto.nombreComercial}
            </h1>
          </div>
          <Button asChild variant="outline">
            <Link href={`/comercial/prospectos/${id}`}>Volver al detalle</Link>
          </Button>
        </section>

        <ProspectoFormulario modo="editar" prospecto={prospecto} />
      </div>
    </main>
  );
}
