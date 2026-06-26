"use client"

import { useState } from "react"

import { TarifariosListado } from "../componentes/tarifarios-listado"
import type { FiltrosTarifarios } from "../tipos/tarifarios.tipos"

export function TarifariosVista({
  filtrosIniciales,
}: {
  filtrosIniciales: FiltrosTarifarios
}) {
  const [filtros, setFiltros] = useState<FiltrosTarifarios>(filtrosIniciales)

  function handleFiltrosChange(parcial: Partial<FiltrosTarifarios>) {
    setFiltros((actual) => {
      const siguiente = { ...actual, ...parcial }
      if (
        "idClienteExterno" in parcial ||
        "estado" in parcial ||
        "tipoOrigen" in parcial
      ) {
        siguiente.pagina = 1
      }
      return siguiente
    })
  }

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <TarifariosListado filtros={filtros} onFiltrosChange={handleFiltrosChange} />
    </main>
  )
}
