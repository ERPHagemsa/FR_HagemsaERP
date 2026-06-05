import { ActivosTabla } from "../../activos/componentes/activos-tabla"; // reuse styles if desired
import { SiteHeader } from "@/compartido/componentes/site-header";
import { obtenerVehiculos } from "../servicios/flota-api";
import Link from "next/link";

export async function FlotaVista() {
  const items = await obtenerVehiculos();

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-sm font-medium text-muted-foreground">BC-04</p>
          <h1 className="text-2xl font-semibold">Flota y disponibilidad</h1>
          <p className="mt-1 text-sm text-muted-foreground">Lista de unidades y contratos.</p>
        </section>

        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 font-medium text-slate-500">Placa</th>
                  <th className="px-6 py-4 font-medium text-slate-500">Marca</th>
                  <th className="px-6 py-4 font-medium text-slate-500">Contrato</th>
                  <th className="px-6 py-4 font-medium text-slate-500">Cuenta</th>
                  <th className="px-6 py-4 font-medium text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((v: any) => (
                  <tr key={v.id}>
                    <td className="px-6 py-4 font-medium">{v.placaRodaje ?? v.id}</td>
                    <td className="px-6 py-4">{v.marca}</td>
                    <td className="px-6 py-4">{v.contrato ?? "-"}</td>
                    <td className="px-6 py-4">{v.cuenta ?? "-"}</td>
                    <td className="px-6 py-4">
                      <Link href={`/flota/${encodeURIComponent(v.id)}`} className="text-sky-600">Ver / Editar</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

export default FlotaVista;
