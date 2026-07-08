import { SiteHeader } from "@/compartido/componentes/site-header"
import { CatalogoTiposUnidadVista } from "@/modulos/comercial/catalogos/tipos-unidad/vistas/catalogo-tipos-unidad-vista"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function Page() {
  return (
    <>
      <SiteHeader
        title="Tipos de unidad"
        breadcrumbs={[
          { title: "Gestión Comercial", href: "/comercial" },
          { title: "Tipos de unidad" },
        ]}
      />
      <CatalogoTiposUnidadVista />
    </>
  )
}
