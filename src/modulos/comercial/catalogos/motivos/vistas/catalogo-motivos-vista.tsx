"use client"

import { useState } from "react"

import { PaginaListado } from "../../../componentes/pagina-listado"
import { CatalogoMotivosListado } from "../componentes/catalogo-motivos-listado"
import type { FiltrosCatalogosMotivo } from "../tipos/motivos.tipos"

interface PropsCatalogoMotivosVista {
  filtrosIniciales: FiltrosCatalogosMotivo
}

export function CatalogoMotivosVista({
  filtrosIniciales,
}: PropsCatalogoMotivosVista) {
  const [filtros, setFiltros] = useState<FiltrosCatalogosMotivo>(filtrosIniciales)

  function handleFiltrosChange(parcial: Partial<FiltrosCatalogosMotivo>) {
    setFiltros((actual) => {
      const siguiente = { ...actual, ...parcial }
      if ("busqueda" in parcial || "estado" in parcial || "tipo" in parcial) {
        siguiente.pagina = 1
      }
      return siguiente
    })
  }

  return (
    <PaginaListado>
      <CatalogoMotivosListado
        filtros={filtros}
        onFiltrosChange={handleFiltrosChange}
      />
    </PaginaListado>
  )
}
