import { SiteHeader } from "@/compartido/componentes/site-header"
import { Spinner } from "@/compartido/componentes/ui/spinner"

export default function NuevoSocioNegocioLoading() {
  return (
    <>
      <SiteHeader
        title="Nuevo socio de negocio"
        breadcrumbs={[
          { title: "Socio de Negocio", href: "/socio-negocios" },
          { title: "Registro" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex min-h-80 w-full items-center justify-center rounded-lg border border-border bg-card text-card-foreground">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            Cargando formulario...
          </div>
        </div>
      </main>
    </>
  )
}
