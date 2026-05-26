import { SiteHeader } from "@/compartido/componentes/site-header"

import { SocioNegocioFormulario } from "../componentes/socio-negocio-formulario"
import type { TipoSocioDeNegocio } from "../tipos/socio-negocio"

type SocioNegocioNuevoVistaProps = {
  tipo?: TipoSocioDeNegocio
}

const tituloPorTipo = {
  CLIENTE: "Nuevo cliente",
  PROVEEDOR: "Nuevo proveedor",
  PERSONAL: "Nuevo personal",
} satisfies Record<TipoSocioDeNegocio, string>

export function SocioNegocioNuevoVista({ tipo }: SocioNegocioNuevoVistaProps) {
  const titulo = tipo ? tituloPorTipo[tipo] : "Nuevo socio de negocio"

  return (
    <>
      <SiteHeader
        title={titulo}
        breadcrumbs={[
          { title: "Socio de Negocio", href: "/socio-negocios" },
          { title: tipo ? tituloPorTipo[tipo].replace("Nuevo ", "") : "Registro" },
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
