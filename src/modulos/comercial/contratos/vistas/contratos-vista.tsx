"use client"

import { useState } from "react"

import { ContratosListado } from "../componentes/contratos-listado"
import type { FiltrosContratos } from "../tipos/contratos.tipos"

export function ContratosVista({
  filtrosIniciales,
}: {
  filtrosIniciales: FiltrosContratos
}) {
  const [filtros, setFiltros] = useState<FiltrosContratos>(filtrosIniciales)

  function handleFiltrosChange(parcial: Partial<FiltrosContratos>) {
    setFiltros((actual) => {
      const siguiente = { ...actual, ...parcial }
      if ("idClienteExterno" in parcial || "estado" in parcial) {
        siguiente.pagina = 1
      }
      return siguiente
    })
  }

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <ContratosListado filtros={filtros} onFiltrosChange={handleFiltrosChange} />
    </main>
  )
}
