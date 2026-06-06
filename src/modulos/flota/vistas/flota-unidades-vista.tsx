import { FlotaTabla } from "../componentes/flota-tabla";
import { obtenerAsignaciones } from "../servicios/flota-api";
import type { VehiculoFlota } from "../tipos/flota.tipos";

// Server Component — los datos se pasan desde el servidor directamente
export async function FlotaUnidadesVista() {
  const items: VehiculoFlota[] = await obtenerAsignaciones();

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-sm font-medium text-muted-foreground">BC-04</p>
          <h1 className="text-2xl font-semibold">Unidades de Flota</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Listado general de vehículos, estados y contratos.
          </p>
        </section>

        <FlotaTabla loading={false} vehiculos={items} />
      </div>
    </main>
  );
}

export default FlotaUnidadesVista;
