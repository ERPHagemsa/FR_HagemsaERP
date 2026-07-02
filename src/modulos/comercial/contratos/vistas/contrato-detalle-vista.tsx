"use client"

import { ContratoDetalle } from "../componentes/contrato-detalle"

export function ContratoDetalleVista({ id }: { id: string }) {
  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <ContratoDetalle idContrato={id} />
    </main>
  )
}
