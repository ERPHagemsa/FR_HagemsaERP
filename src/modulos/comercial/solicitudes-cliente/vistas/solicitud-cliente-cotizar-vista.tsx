"use client";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { useConsulta } from "@/compartido/api/use-consulta";
import { Button } from "@/compartido/componentes/ui/button";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { CotizacionEditorNuevo } from "../../cotizaciones/componentes/cotizacion-editor-nuevo";
import { EstadoSolicitudBadge } from "../componentes/estado-solicitud-badge";
import { consultarSolicitudCliente } from "../servicios/solicitudes-cliente-api";
import { accionesPermitidasSC } from "../tipos/solicitud-cliente.tipos";

type Props = {
  id: string;
};

export function SolicitudClienteCotizarVista({ id }: Props) {
  const { data: sc, isLoading } = useConsulta(
    () => consultarSolicitudCliente(id).catch(() => null),
    [id],
  );

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!sc) {
    notFound();
  }

  // Gating: la SC debe admitir agregar cotizacion (no CERRADA / DESCARTADA).
  if (!accionesPermitidasSC(sc.estado).agregarCotizacion) {
    redirect(`/comercial/solicitudes-cliente/${id}`);
  }

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        {/* Encabezado: contexto de la SC */}
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground">
              Nueva cotización para
            </p>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold leading-tight">
                {sc.nombreSolicitante}
              </h1>
              <EstadoSolicitudBadge estado={sc.estado} />
            </div>
            <p className="text-sm text-muted-foreground">{sc.descripcionServicio}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/comercial/solicitudes-cliente/${id}`}>
                Volver a la solicitud
              </Link>
            </Button>
          </div>
        </section>

        {/* Editor en modo creacion */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">
            Cotización (BORRADOR) — arma el contenido y créala
          </h2>
          <CotizacionEditorNuevo
            solicitudClienteId={id}
            clienteTipo={sc.origenTipo}
            clienteId={sc.origenId}
          />
        </section>
      </div>
    </main>
  );
}
