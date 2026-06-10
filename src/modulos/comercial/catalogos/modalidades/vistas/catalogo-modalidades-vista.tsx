"use client"

import { useState } from "react"

import type { FiltrosModalidades } from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos"

import { CatalogoModalidadesListado } from "../componentes/catalogo-modalidades-listado"

interface PropsCatalogoModalidadesVista {
  filtrosIniciales: FiltrosModalidades
}

export function CatalogoModalidadesVista({
  filtrosIniciales,
}: PropsCatalogoModalidadesVista) {
  const [filtros, setFiltros] = useState<FiltrosModalidades>(filtrosIniciales)

  function handleFiltrosChange(parcial: Partial<FiltrosModalidades>) {
    setFiltros((actual) => {
      const siguiente = { ...actual, ...parcial }
      // Resetear pagina al cambiar filtros textuales o de categoria
      if (
        "busqueda" in parcial ||
        "estado" in parcial ||
        "tipo" in parcial ||
        "tipoLinea" in parcial
      ) {
        siguiente.pagina = 1
      }
      return siguiente
    })
  }

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <CatalogoModalidadesListado
        filtros={filtros}
        onFiltrosChange={handleFiltrosChange}
      />
    </main>
  )
}
