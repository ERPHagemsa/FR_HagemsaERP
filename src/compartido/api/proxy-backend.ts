import { NextResponse, type NextRequest } from "next/server"

import { obtenerAccessToken } from "@/compartido/autenticacion/sesion-servidor"

// Helper reusable para los Route Handlers que actuan de proxy (BFF) hacia un
// backend del ecosistema. Centraliza el patron que antes estaba duplicado en
// cada handler: leer la cookie httpOnly, inyectar Authorization: Bearer,
// reenviar metodo/path/query/body y devolver la respuesta cruda (incluyendo
// 204 y passthrough de Content-Type).
//
// El JWT NUNCA queda expuesto al JS del cliente: vive en la cookie httpOnly y
// solo este handler (server-only) lo lee para inyectarlo en el header.
//
// USO (en src/app/api/<bc>/[[...path]]/route.ts):
//
//   import { crearProxyBackend } from "@/compartido/api/proxy-backend"
//   import { URLS_SERVIDOR } from "@/compartido/api/config-servidor"
//
//   export const { GET, POST, PUT, PATCH, DELETE } = crearProxyBackend({
//     destino: () => URLS_SERVIDOR.activos,
//     nombre: "activos",
//   })

const METODOS_CON_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"])

type OpcionesProxy = {
  // URL base del backend destino. Es una funcion (lazy) para leer la env var
  // en cada request y no congelarla al cargar el modulo.
  destino: () => string
  // Nombre del servicio para el mensaje de 503 (en espanol natural).
  nombre: string
  // Segmento fijo que se antepone al path reenviado, cuando el backend agrupa
  // sus recursos bajo un prefijo distinto al segmento de la ruta de Next
  // (ej. "configuracion-general", "asignaciones-personal").
  prefijoDestino?: string
  // Predicado opcional: rutas que NO requieren sesion (ej. un /estado publico).
  // Recibe el metodo HTTP y los segmentos del path capturado.
  esRutaPublica?: (metodo: string, segmentos: string[]) => boolean
}

type Ctx = {
  params: Promise<{ path?: string[] }>
}

function unirUrl(
  base: string,
  prefijo: string | undefined,
  segmentos: string[],
  query: string,
): string {
  const raiz = base.replace(/\/+$/, "")
  const pre = prefijo ? `/${prefijo.replace(/^\/+|\/+$/g, "")}` : ""
  const sub = segmentos.length > 0 ? `/${segmentos.join("/")}` : ""
  return `${raiz}${pre}${sub}${query}`
}

export function crearProxyBackend(opciones: OpcionesProxy) {
  async function reenviar(
    request: NextRequest,
    ctx: Ctx,
  ): Promise<NextResponse> {
    const { path = [] } = await ctx.params
    const esPublica = opciones.esRutaPublica?.(request.method, path) ?? false

    const accessToken = esPublica ? null : await obtenerAccessToken()
    if (!accessToken && !esPublica) {
      return NextResponse.json(
        { message: "Sesion no iniciada." },
        { status: 401 },
      )
    }

    const urlDestino = unirUrl(
      opciones.destino(),
      opciones.prefijoDestino,
      path,
      request.nextUrl.search,
    )

    const headers: Record<string, string> = {}
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
      const body = await request.text()
      if (body) {
        init.body = body
      }
    }

    let respuesta: Response
    try {
      respuesta = await fetch(urlDestino, init)
    } catch (error) {
      console.error(
        `[bff:${opciones.nombre}] ${request.method} ${urlDestino} -> fetch fallo`,
        error,
      )
      return NextResponse.json(
        { message: `Servicio de ${opciones.nombre} no disponible.` },
        { status: 503 },
      )
    }

    const texto = await respuesta.text()
    const tipo = respuesta.headers.get("content-type") ?? ""

    // Diagnostico: si el backend respondio con error, dejamos rastro server-side
    // (status + URL destino + tipo de contenido). En dev tambien un fragmento del
    // cuerpo para ver respuestas no-JSON (404 HTML, gateway, etc.).
    if (respuesta.status >= 400) {
      const detalle =
        process.env.NODE_ENV !== "production"
          ? ` body: ${texto.slice(0, 300)}`
          : ""
      console.warn(
        `[bff:${opciones.nombre}] ${request.method} ${urlDestino} -> ${respuesta.status} (${tipo || "sin content-type"})${detalle}`,
      )
    }

    if (respuesta.status === 204 || texto.length === 0) {
      return new NextResponse(null, { status: respuesta.status })
    }

    return new NextResponse(texto, {
      status: respuesta.status,
      headers: { "Content-Type": tipo || "application/json" },
    })
  }

  return {
    GET: reenviar,
    POST: reenviar,
    PUT: reenviar,
    PATCH: reenviar,
    DELETE: reenviar,
  }
}
