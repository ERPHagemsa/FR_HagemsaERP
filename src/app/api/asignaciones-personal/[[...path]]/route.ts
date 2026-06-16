import { NextResponse, type NextRequest } from "next/server"

import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"
import { obtenerAccessToken } from "@/compartido/autenticacion/sesion-servidor"

type Ctx = {
  params: Promise<{ path?: string[] }>
}

const METODOS_CON_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"])

async function reenviar(request: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const { path = [] } = await ctx.params
  const accessToken = await obtenerAccessToken()

  if (!accessToken) {
    return NextResponse.json({ message: "Sesion no iniciada." }, { status: 401 })
  }

  const base = URLS_SERVIDOR.socioNegocios.replace(/\/+$/, "")
  const subruta = path.length > 0 ? `/${path.join("/")}` : ""
  const urlDestino = `${base}/asignaciones-personal${subruta}${request.nextUrl.search}`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  }
  const contentType = request.headers.get("content-type")
  if (contentType) headers["Content-Type"] = contentType

  const init: RequestInit = { method: request.method, headers }
  if (METODOS_CON_BODY.has(request.method)) {
    const body = await request.text()
    if (body) init.body = body
  }

  try {
    const respuesta = await fetch(urlDestino, init)
    const texto = await respuesta.text()
    const tipo = respuesta.headers.get("content-type") ?? "application/json"

    if (respuesta.status === 204 || !texto) {
      return new NextResponse(null, { status: respuesta.status })
    }

    return new NextResponse(texto, {
      status: respuesta.status,
      headers: { "Content-Type": tipo },
    })
  } catch {
    return NextResponse.json(
      { message: "Servicio de asignaciones de personal no disponible." },
      { status: 503 },
    )
  }
}

export async function GET(request: NextRequest, ctx: Ctx) {
  return reenviar(request, ctx)
}

export async function POST(request: NextRequest, ctx: Ctx) {
  return reenviar(request, ctx)
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  return reenviar(request, ctx)
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  return reenviar(request, ctx)
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  return reenviar(request, ctx)
}
