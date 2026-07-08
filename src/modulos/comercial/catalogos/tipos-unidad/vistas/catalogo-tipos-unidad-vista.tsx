"use client"

import { PaginaListado } from "../../../componentes/pagina-listado"
import { CatalogoTiposUnidadListado } from "../componentes/catalogo-tipos-unidad-listado"

export function CatalogoTiposUnidadVista() {
  return (
    <PaginaListado>
      <CatalogoTiposUnidadListado />
    </PaginaListado>
  )
}
