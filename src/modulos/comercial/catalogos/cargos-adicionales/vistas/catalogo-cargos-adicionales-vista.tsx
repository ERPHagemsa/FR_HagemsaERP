"use client"

import { useState } from "react"

import type { FiltrosCatalogosCargoAdicional } from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos"

import { PaginaListado } from "../../../componentes/pagina-listado"
import { CatalogoCargosAdicionalesListado } from "../componentes/catalogos-cargo-adicionales-listado"

interface PropsCatalogoCargosAdicionalesVista {
  filtrosIniciales: FiltrosCatalogosCargoAdicional
}

export function CatalogoCargosAdicionalesVista({
  filtrosIniciales,
}: PropsCatalogoCargosAdicionalesVista) {
  const [filtros, setFiltros] = useState<FiltrosCatalogosCargoAdicional>(filtrosIniciales)

  function handleFiltrosChange(parcial: Partial<FiltrosCatalogosCargoAdicional>) {
    setFiltros((actual) => {
      const siguiente = { ...actual, ...parcial }
      // Resetear pagina al cambiar busqueda o estado
      if ("busqueda" in parcial || "estado" in parcial) {
        siguiente.pagina = 1
      }
      return siguiente
    })
  }

  return (
    <PaginaListado>
      <CatalogoCargosAdicionalesListado
        filtros={filtros}
        onFiltrosChange={handleFiltrosChange}
      />
    </PaginaListado>
  )
}
