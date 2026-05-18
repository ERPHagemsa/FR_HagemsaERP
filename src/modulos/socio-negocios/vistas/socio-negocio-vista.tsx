import { SiteHeader } from "@/compartido/componentes/site-header"

type SocioNegocioVistaProps = {
  titulo: string
  descripcion: string
  metricas: {
    etiqueta: string
    valor: string
  }[]
  registros: {
    codigo: string
    nombre: string
    estado: string
  }[]
}

export function SocioNegocioVista({
  titulo,
  descripcion,
  metricas,
  registros,
}: SocioNegocioVistaProps) {
  return (
    <>
      <SiteHeader title={titulo} />
      <main className="flex min-h-screen flex-col px-6 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8">
          <header className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Socio de Negocios
            </span>
            <div className="flex flex-col gap-2">
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {titulo}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                {descripcion}
              </p>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            {metricas.map((metrica) => (
              <article
                key={metrica.etiqueta}
                className="rounded-3xl border bg-card p-5 text-card-foreground shadow-sm"
              >
                <p className="text-sm text-muted-foreground">
                  {metrica.etiqueta}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">
                  {metrica.valor}
                </p>
              </article>
            ))}
          </section>

          <section className="overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Registros recientes
              </h2>
            </div>
            <div className="divide-y">
              {registros.map((registro) => (
                <article
                  key={registro.codigo}
                  className="grid gap-3 px-6 py-4 text-sm md:grid-cols-[120px_1fr_160px] md:items-center"
                >
                  <span className="font-mono text-xs font-medium text-muted-foreground">
                    {registro.codigo}
                  </span>
                  <span className="font-medium text-foreground">
                    {registro.nombre}
                  </span>
                  <span className="w-fit rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                    {registro.estado}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
