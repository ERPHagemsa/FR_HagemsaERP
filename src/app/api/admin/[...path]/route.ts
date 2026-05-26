import { NextResponse, type NextRequest } from "next/server"

import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"
import { obtenerAccessToken } from "@/compartido/autenticacion/sesion-servidor"

// Proxy server-side a /api/admin/* del Auth Service.
//
// El navegador pega a /api/admin/<recurso> de Next; este Route Handler lee la
// cookie httpOnly hagemsa_access, inyecta Authorization: Bearer <jwt> y
// reenvia al Auth Service real. Asi el JWT nunca queda expuesto al JS del
// cliente.
//
// Pasa cualquier metodo (GET, POST, PATCH, PUT, DELETE) y preserva el body
// crudo (no parsea JSON) para soportar tanto application/json como otros.

type Ctx = {
  params: Promise<{ path: string[] }>
}

const METODOS_CON_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"])

async function reenviar(request: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const accessToken = await obtenerAccessToken()
  if (!accessToken) {
    return NextResponse.json(
      { message: "Sesion no iniciada." },
      { status: 401 },
    )
  }

  const { path } = await ctx.params
  const subruta = path.join("/")
  const query = request.nextUrl.search
  const urlDestino = `${URLS_SERVIDOR.authService}/api/admin/${subruta}${query}`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  }

  const contentType = request.headers.get("content-type")
  if (contentType) {
    headers["Content-Type"] = contentType
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  }

  if (METODOS_CON_BODY.has(request.method)) {
    init.body = await request.text()
    if (!init.body) {
      delete init.body
    }
  }

  let respuesta: Response
  try {
    respuesta = await fetch(urlDestino, init)
  } catch {
    return NextResponse.json(
      { message: "Servicio de administracion no disponible." },
      { status: 503 },
    )
  }

  const texto = await respuesta.text()
  const tipo = respuesta.headers.get("content-type") ?? ""

  if (respuesta.status === 204 || texto.length === 0) {
    return new NextResponse(null, { status: respuesta.status })
  }

  if (tipo.includes("application/json")) {
    return new NextResponse(texto, {
      status: respuesta.status,
      headers: { "Content-Type": "application/json" },
    })
  }

  return new NextResponse(texto, {
    status: respuesta.status,
    headers: { "Content-Type": tipo || "text/plain" },
  })
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
