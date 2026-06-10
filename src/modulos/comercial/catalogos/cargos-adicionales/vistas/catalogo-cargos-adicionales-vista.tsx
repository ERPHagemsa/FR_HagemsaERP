"use client"

import { useState } from "react"

import type { FiltrosCatalogosCargoAdicional } from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos"

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
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <CatalogoCargosAdicionalesListado
        filtros={filtros}
        onFiltrosChange={handleFiltrosChange}
      />
    </main>
  )
}
