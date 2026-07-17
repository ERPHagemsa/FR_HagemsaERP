"use client";

import Link from "next/link";

import { useConsulta } from "@/compartido/api/use-consulta";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert";
import { Button } from "@/compartido/componentes/ui/button";
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

  // Guarda contra acceso directo por URL: un activo replaqueado es
  // referencia historica; editarlo permitiria reactivar o alterar data
  // que ya vive en el activo que lo reemplazo.
  const reemplazo = data?.activo?.activoReemplazo;
  if (reemplazo) {
    return (
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full max-w-2xl flex-col gap-4">
          <Alert>
            <AlertTitle>Este activo ya fue replaqueado</AlertTitle>
            <AlertDescription>
              {data?.activo?.codigo} quedo de baja como referencia historica y
              no puede editarse. La ficha vigente es {reemplazo.codigo}.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/activos/${codigo}`}>Ver ficha historica</Link>
            </Button>
            <Button asChild>
              <Link href={`/activos/${reemplazo.codigo}`}>
                Ir al activo vigente
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

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
