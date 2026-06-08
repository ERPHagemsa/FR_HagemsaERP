import Link from "next/link";

import { Button } from "@/compartido/componentes/ui/button";
import { ActivoFormulario } from "../componentes/activo-formulario";
import {
  obtenerActivoPorCodigo,
  obtenerDocumentosPorCodigo,
  obtenerImagenesPorCodigo,
  obtenerTanquesPorCodigo,
} from "../servicios/activos-api";

type Props = {
  codigo: string;
};

export async function ActivoEditarVista({ codigo }: Props) {
  const activo = await obtenerActivoPorCodigo(codigo);
  const documentos = await obtenerDocumentosPorCodigo(codigo).catch(() => []);
  const imagenes = await obtenerImagenesPorCodigo(codigo).catch(() => []);
  const tanques = await obtenerTanquesPorCodigo(codigo).catch(() => []);

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-normal">
              Actualizar activo
            </h1>
            <p className="text-sm text-muted-foreground">{activo.codigo}</p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/activos/${activo.codigo}`}>Volver</Link>
          </Button>
        </section>

        <ActivoFormulario
          activo={activo}
          documentos={documentos}
          imagenes={imagenes}
          modo="editar"
          tanques={tanques}
        />
      </div>
    </main>
  );
}
