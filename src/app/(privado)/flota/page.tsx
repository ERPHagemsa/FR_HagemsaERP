import { SiteHeader } from "@/compartido/componentes/site-header";
import { obtenerConfiguracionApi } from "@/compartido/api/config";
import Link from "next/link";

export default async function FlotaPage() {
  const cfg = obtenerConfiguracionApi("flota");
  let items: any[] = [];
  let backendAvailable = true;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${cfg.baseUrl}/vehiculos`, { cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      items = data.items || [];
    } else {
      backendAvailable = false;
    }
  } catch (e) {
    backendAvailable = false;
    items = [];
  }

  return (
    <>
      <SiteHeader title="Flota y Disponibilidad" />
      <main className="flex min-h-screen flex-col bg-sky-50 px-6 py-12 text-slate-900">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8">
          <header className="space-y-3">
            <span className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              Modulo
            </span>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight">Flota</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600">
                Lista de unidades y contratos asociados (datos desde BC04_Flota mock).
              </p>
            </div>
          </header>

          <section className="overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-sm">
            {!backendAvailable && (
              <div className="p-4 text-sm text-yellow-700 bg-yellow-50">No se pudo conectar al servicio de Flota. Mostrando datos locales/mocks.</div>
            )}
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
                      <Link href={`/flota/${encodeURIComponent(v.id)}`} className="text-sky-600">
                        Ver / Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </>
  );
}
