"use client"

import { useState } from "react"

import type { FiltrosCatalogosCondicion } from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos"

import { PaginaListado } from "../../../componentes/pagina-listado"
import { CatalogoCondicionesListado } from "../componentes/catalogo-condiciones-listado"

interface PropsCatalogoCondicionesVista {
  filtrosIniciales: FiltrosCatalogosCondicion
}

export function CatalogoCondicionesVista({
  filtrosIniciales,
}: PropsCatalogoCondicionesVista) {
  const [filtros, setFiltros] = useState<FiltrosCatalogosCondicion>(filtrosIniciales)

  function handleFiltrosChange(parcial: Partial<FiltrosCatalogosCondicion>) {
    setFiltros((actual) => {
      const siguiente = { ...actual, ...parcial }
      // Resetear pagina al cambiar busqueda, estado o categoria
      if ("busqueda" in parcial || "estado" in parcial || "categoria" in parcial) {
        siguiente.pagina = 1
      }
      return siguiente
    })
  }

  return (
    <PaginaListado>
      <CatalogoCondicionesListado
        filtros={filtros}
        onFiltrosChange={handleFiltrosChange}
      />
    </PaginaListado>
  )
}
