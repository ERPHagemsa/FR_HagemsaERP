const rutas = [
  {
    href: "/activos",
    titulo: "Activos",
    descripcion: "Maestro oficial de unidades y especificaciones tecnicas.",
  },
  {
    href: "/despacho",
    titulo: "Despacho",
    descripcion: "Operacion, asignaciones y salida de unidades.",
  },
  {
    href: "/comercial",
    titulo: "Comercial",
    descripcion: "Clientes, cotizaciones y seguimiento de oportunidades.",
  },
  {
    href: "/flota",
    titulo: "Flota",
    descripcion: "Disponibilidad, estado operativo y mantenimiento.",
  },
  {
    href: "/combustible",
    titulo: "Combustible",
    descripcion: "Solicitudes y abastecimientos de combustible.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-6 py-12 text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <section className="rounded-[2rem] bg-slate-950 px-8 py-10 text-white shadow-xl shadow-slate-300/40">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Frontend base
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Estructura inicial organizada por modulos y piezas compartidas.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            La aplicacion ya separa rutas de Next.js, contexto funcional y
            recursos reutilizables para que el crecimiento del proyecto sea mas
            ordenado.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {rutas.map((ruta) => (
            <a
              key={ruta.href}
              href={ruta.href}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-1"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Ruta
              </p>
              <h2 className="mt-3 text-2xl font-semibold">{ruta.titulo}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {ruta.descripcion}
              </p>
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}
