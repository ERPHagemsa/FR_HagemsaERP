import { ActivosResumen } from "../componentes/activos-resumen";
import { ActivosTabla } from "../componentes/activos-tabla";
import { obtenerActivos } from "../servicios/activos-api";

export async function ActivosVista() {
  const activos = await obtenerActivos();

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-sm font-medium text-muted-foreground">BC-13</p>
          <h1 className="text-2xl font-semibold">Gestion de Activos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Maestro oficial de unidades y especificaciones tecnicas.
          </p>
        </section>

        <ActivosResumen activos={activos} />
        <ActivosTabla activos={activos} />
      </div>
    </main>
  );
}
