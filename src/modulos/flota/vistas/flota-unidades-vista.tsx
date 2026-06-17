import { SiteHeader } from "@/compartido/componentes/site-header";
import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/compartido/componentes/ui/button";
import { FlotaTabla } from "../componentes/flota-tabla";
import { obtenerUnidades } from "../servicios/flota-api";
import type { VehiculoFlota } from "../tipos/flota.tipos";

export async function FlotaUnidadesVista() {
  const items: VehiculoFlota[] = await obtenerUnidades();

  return (
    <>
      <SiteHeader
        title="Listar unidades de flota"
        breadcrumbs={[
          { title: "Flota y Disponibilidad", href: "/flota" },
          { title: "Listar unidades de flota" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-normal">
                Listar unidades de flota
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Unidades registradas en la flota. Usa &quot;Nuevo&quot; para importar desde Activos.
              </p>
            </div>
            <Button asChild variant="default" id="btn-importar-unidades">
              <Link href="/flota/unidades/importar">
                <Download className="mr-2 size-4" />
                Nuevo
              </Link>
            </Button>
          </div>

          <FlotaTabla loading={false} vehiculos={items} />
        </div>
      </main>
    </>
  );
}

export default FlotaUnidadesVista;

