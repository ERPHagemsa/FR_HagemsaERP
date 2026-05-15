const metricas = [
  { etiqueta: "Cotizaciones activas", valor: "24" },
  { etiqueta: "Clientes priorizados", valor: "8" },
  { etiqueta: "Oportunidades nuevas", valor: "5" },
];

export default function ComercialPage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8">
        <header className="space-y-3">
          <span className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Modulo
          </span>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight">Comercial</h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              Ruta base para las vistas comerciales. Desde aqui podemos conectar
              pantallas del modulo y reutilizar componentes compartidos.
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {metricas.map((metrica) => (
            <article
              key={metrica.etiqueta}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-slate-500">{metrica.etiqueta}</p>
              <p className="mt-3 text-3xl font-semibold">{metrica.valor}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
