import { NextResponse, type NextRequest } from "next/server"

import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"
import { obtenerAccessToken } from "@/compartido/autenticacion/sesion-servidor"

type Ctx = {
  params: Promise<{ path?: string[] }>
}

const METODOS_CON_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"])

function unirUrl(baseUrl: string, subruta: string, query: string) {
  const base = baseUrl.replace(/\/+$/, "")
  const path = subruta ? `/${subruta}` : ""
  return `${base}${path}${query}`
}

async function reenviar(request: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const { path = [] } = await ctx.params
  const esEstadoPublico = request.method === "GET" && path.length === 1 && path[0] === "estado"

  const accessToken = esEstadoPublico ? null : await obtenerAccessToken()
  if (!accessToken && !esEstadoPublico) {
    return NextResponse.json({ message: "Sesion no iniciada." }, { status: 401 })
  }

  const urlDestino = unirUrl(
    URLS_SERVIDOR.socioNegocios,
    path.join("/"),
    request.nextUrl.search,
  )

  const headers: Record<string, string> = {
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
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
      { message: "Servicio de socio de negocio no disponible." },
      { status: 503 },
    )
  }

  const texto = await respuesta.text()
  const tipo = respuesta.headers.get("content-type") ?? ""

  if (respuesta.status === 204 || texto.length === 0) {
    return new NextResponse(null, { status: respuesta.status })
  }

  return new NextResponse(texto, {
    status: respuesta.status,
    headers: { "Content-Type": tipo || "application/json" },
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
