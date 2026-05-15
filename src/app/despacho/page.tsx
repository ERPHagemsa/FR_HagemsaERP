const pendientes = [
  "Asignar unidades a despachos del turno manana",
  "Validar documentos pendientes de salida",
  "Confirmar ventanas horarias con patio",
];

export default function DespachoPage() {
  return (
    <main className="flex min-h-screen flex-col bg-amber-50 px-6 py-12 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8">
        <header className="space-y-3">
          <span className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
            Modulo
          </span>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight">Despacho</h1>
            <p className="max-w-2xl text-base leading-7 text-slate-700">
              Punto de entrada para el flujo operativo de despacho dentro del
              App Router.
            </p>
          </div>
        </header>

        <section className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Pendientes de arranque</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            {pendientes.map((pendiente) => (
              <li key={pendiente}>{pendiente}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
