import { obtenerAsignaciones } from "../servicios/flota-api";
import { FlotaResumen } from "../componentes/flota-resumen";
import type { VehiculoFlota } from "../tipos/flota.tipos";
import Link from "next/link";
import { Button } from "@/compartido/componentes/ui/button";

// Server Component — fetches data on the server and passes to client children
export async function FlotaVista() {
  const items: VehiculoFlota[] = await obtenerAsignaciones();

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">BC-04</p>
              <h1 className="text-2xl font-semibold">Flota y disponibilidad</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Dashboard general de unidades y contratos.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/flota/unidades">
                <Button variant="ghost">Ver Unidades</Button>
              </Link>
              <Button asChild>
                <Link href="/flota/unidades/new">Nueva Asignación</Link>
              </Button>
            </div>
          </div>
        </section>

        <FlotaResumen resumen={null} vehiculos={items} />
      </div>
    </main>
  );
}

export default FlotaVista;
