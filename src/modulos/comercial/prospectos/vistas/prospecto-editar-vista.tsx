import { notFound, redirect } from "next/navigation";

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
        <ProspectoFormulario modo="editar" prospecto={prospecto} />
      </div>
    </main>
  );
}
