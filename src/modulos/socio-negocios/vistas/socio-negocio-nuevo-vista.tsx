import { SiteHeader } from "@/compartido/componentes/site-header"

import { SocioNegocioFormulario } from "../componentes/socio-negocio-formulario"
import type { TipoSocioDeNegocio } from "../tipos/socio-negocio"

type SocioNegocioNuevoVistaProps = {
  tipo?: TipoSocioDeNegocio
}

export function SocioNegocioNuevoVista({ tipo }: SocioNegocioNuevoVistaProps) {
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
        <div className="flex w-full flex-col gap-5">
          <SocioNegocioFormulario tipoInicial={tipo} />
        </div>
      </main>
    </>
  )
}
