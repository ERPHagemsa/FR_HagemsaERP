import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/compartido/componentes/ui/button";

import { CotizacionAcciones } from "../componentes/cotizacion-acciones";
import { CotizacionCabecera } from "../componentes/cotizacion-cabecera";
import { CotizacionVersiones } from "../componentes/cotizacion-versiones";
import { consultarCotizacion } from "../servicios/cotizaciones-api";

type Props = {
  id: string;
};

export async function CotizacionDetalleVista({ id }: Props) {
  const cotizacion = await consultarCotizacion(id).catch(() => null);

  if (!cotizacion) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        {/* Encabezado con acciones */}
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground">BC-03 / Cotizaciones</p>
            <p className="font-mono text-xs text-muted-foreground">{cotizacion.id}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/comercial/cotizaciones">Volver al listado</Link>
            </Button>
            <CotizacionAcciones cotizacion={cotizacion} />
          </div>
        </section>

        {/* Cabecera con datos del encabezado */}
        <CotizacionCabecera cotizacion={cotizacion} />

        {/* Historial de versiones */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">
            Historial de versiones ({cotizacion.versiones.length})
          </h2>
          <CotizacionVersiones
            versiones={cotizacion.versiones}
            versionVigente={cotizacion.versionVigente}
          />
        </section>
      </div>
    </main>
  );
}
