import { SiteHeader } from "@/compartido/componentes/site-header";
import { FlotaTabla } from "../componentes/flota-tabla";
import { obtenerAsignaciones } from "../servicios/flota-api";
import type { VehiculoFlota } from "../tipos/flota.tipos";

export async function FlotaUnidadesVista() {
  const items: VehiculoFlota[] = await obtenerAsignaciones();

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
            </div>
          </div>

          <FlotaTabla loading={false} vehiculos={items} />
        </div>
      </main>
    </>
  );
}

export default FlotaUnidadesVista;
