"use client";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { useConsulta } from "@/compartido/api/use-consulta";
import { Button } from "@/compartido/componentes/ui/button";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { consultarCotizacion } from "../servicios/cotizaciones-api";
import { accionesPermitidas, etiquetaCodigoCotizacion } from "../tipos/cotizaciones.tipos";
import { CotizacionEditor } from "../componentes/cotizacion-editor";
import { EstadoCotizacionBadge } from "../componentes/estado-cotizacion-badge";

type Props = {
  id: string;
};

export function CotizacionEditarVista({ id }: Props) {
  const { data: cotizacion, isLoading } = useConsulta(
    () => consultarCotizacion(id).catch(() => null),
    [id]
  );

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!cotizacion) {
    notFound();
  }

  // Gating: solo editable si el estado lo permite Y la version vigente no esta congelada
  const acciones = accionesPermitidas(cotizacion.estado);
  const versionVigente = cotizacion.versiones.find(
    (v) => v.numeroVersion === cotizacion.versionVigente
  );
  const editable = acciones.editar && versionVigente && !versionVigente.congelada;

  if (!editable) {
    // Redirigir al detalle con parametro informativo
    redirect(`/comercial/cotizaciones/${id}?bloqueado=1`);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* === Statusbar sticky: volver + identidad + estado + navegacion === */}
      <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-5 py-3 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="shrink-0">
              <Link href={`/comercial/cotizaciones/${id}`} aria-label="Volver al detalle">
                <ArrowLeft />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold">
                  Editor de borrador · Version {cotizacion.versionVigente}
                </h1>
                <EstadoCotizacionBadge estado={cotizacion.estado} />
              </div>
              <p
                className="truncate font-mono text-xs text-muted-foreground"
                title={cotizacion.id}
              >
                {etiquetaCodigoCotizacion(cotizacion)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/comercial/cotizaciones/${id}`}>Ver detalle</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/comercial/cotizaciones">Volver al listado</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-5 py-5 lg:px-8">
        <CotizacionEditor cotizacion={cotizacion} />
      </div>
    </main>
  );
}
