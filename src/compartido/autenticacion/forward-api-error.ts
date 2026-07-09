import { NextResponse } from "next/server"

import { ApiError } from "@/compartido/api"

// Reenvia un error del Auth Service (ApiError) al navegador conservando el
// status y los campos del contrato (§7.5.2), para que el formulario muestre
// `detalle` y los `errores[]` por campo. Errores fuera del contrato -> 500.
export function respuestaDesdeApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    const status = error.status >= 400 ? error.status : 500
    return NextResponse.json(
      {
        estado: status,
        codigo: error.codigo,
        titulo: error.titulo,
        detalle: error.detalle ?? error.message,
        trazaId: error.trazaId,
        errores: error.errores,
      },
      { status },
    )
  }
  return NextResponse.json(
    { detalle: "Error inesperado.", message: "Error inesperado." },
    { status: 500 },
  )
}
