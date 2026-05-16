import { SiteHeader } from "@/compartido/componentes/site-header";

const estados = [
  { unidad: "TRK-201", estado: "Disponible" },
  { unidad: "TRK-118", estado: "En ruta" },
  { unidad: "TRK-087", estado: "Mantenimiento" },
];

export default function FlotaPage() {
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
                Ruta base para seguimiento de unidades, mantenimiento y
                disponibilidad operativa.
              </p>
            </div>
          </header>

          <section className="overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 font-medium text-slate-500">Unidad</th>
                  <th className="px-6 py-4 font-medium text-slate-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {estados.map((estado) => (
                  <tr key={estado.unidad}>
                    <td className="px-6 py-4 font-medium">{estado.unidad}</td>
                    <td className="px-6 py-4 text-slate-600">{estado.estado}</td>
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
