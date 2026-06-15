import Link from "next/link";
import { ListChecks } from "lucide-react";

import { SiteHeader } from "@/compartido/componentes/site-header";
import { Button } from "@/compartido/componentes/ui/button";
import { FlotaResumen } from "../componentes/flota-resumen";
import { obtenerUnidades } from "../servicios/flota-api";
import type { VehiculoFlota } from "../tipos/flota.tipos";

export async function FlotaVista() {
  const items: VehiculoFlota[] = await obtenerUnidades();

  return (
    <>
      <SiteHeader
        title="Flota y Disponibilidad"
        breadcrumbs={[{ title: "Flota y Disponibilidad" }]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-normal">
                Flota y disponibilidad
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Dashboard general de unidades, contratos y disponibilidad.
              </p>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/flota/unidades">
                <ListChecks />
                Ver unidades
              </Link>
            </Button>
          </div>

          <FlotaResumen resumen={null} vehiculos={items} />
        </div>
      </main>
    </>
  );
}

export default FlotaVista;
