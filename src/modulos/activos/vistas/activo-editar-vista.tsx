"use client";

import { useConsulta } from "@/compartido/api/use-consulta";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { ActivoFormulario } from "../componentes/activo-formulario";
import {
  obtenerActivoPorCodigo,
  obtenerDocumentosPorCodigo,
  obtenerImagenesPorCodigo,
  obtenerTanquesPorCodigo,
} from "../servicios/activos-api";

type Props = {
  codigo: string;
  returnTo?: string;
};

export function ActivoEditarVista({ codigo, returnTo }: Props) {
  const { data, isLoading } = useConsulta(async () => {
    const [activo, documentos, imagenes, tanques] = await Promise.all([
      obtenerActivoPorCodigo(codigo),
      obtenerDocumentosPorCodigo(codigo).catch(() => []),
      obtenerImagenesPorCodigo(codigo).catch(() => []),
      obtenerTanquesPorCodigo(codigo).catch(() => []),
    ]);
    return { activo, documentos, imagenes, tanques };
  }, [codigo]);

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        <ActivoFormulario
          activo={data?.activo}
          documentos={data?.documentos ?? []}
          imagenes={data?.imagenes ?? []}
          modo="editar"
          returnTo={returnTo}
          tanques={data?.tanques ?? []}
          tituloPagina="Actualizar activo"
          subtituloPagina={data?.activo?.codigo}
        />
      </div>
    </main>
  );
}
