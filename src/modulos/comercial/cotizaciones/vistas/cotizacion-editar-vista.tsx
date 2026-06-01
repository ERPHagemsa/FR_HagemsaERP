import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/compartido/componentes/ui/button";

import { consultarCotizacion } from "../servicios/cotizaciones-api";
import { accionesPermitidas } from "../tipos/cotizaciones.tipos";
import { CotizacionCabecera } from "../componentes/cotizacion-cabecera";
import { CotizacionEditor } from "../componentes/cotizacion-editor";
import { EstadoCotizacionBadge } from "../componentes/estado-cotizacion-badge";

type Props = {
  id: string;
};

export async function CotizacionEditarVista({ id }: Props) {
  const cotizacion = await consultarCotizacion(id).catch(() => null);

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
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        {/* Encabezado */}
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground">BC-03 / Cotizaciones / Editor de borrador</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs text-muted-foreground">{cotizacion.id}</p>
              <EstadoCotizacionBadge estado={cotizacion.estado} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/comercial/cotizaciones/${id}`}>Ver detalle</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/comercial/cotizaciones">Volver al listado</Link>
            </Button>
          </div>
        </section>

        {/* Cabecera de la cotizacion */}
        <CotizacionCabecera cotizacion={cotizacion} />

        {/* Editor */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">
            Version {cotizacion.versionVigente} — Editor de borrador
          </h2>
          <CotizacionEditor cotizacion={cotizacion} />
        </section>
      </div>
    </main>
  );
}
