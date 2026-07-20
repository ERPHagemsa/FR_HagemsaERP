"use client"

import { TarifarioDetalle } from "../componentes/tarifario-detalle"

export function TarifarioDetalleVista({ id }: { id: string }) {
  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <TarifarioDetalle idTarifario={id} />
    </main>
  )
}
