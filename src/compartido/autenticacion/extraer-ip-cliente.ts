// Extrae la IP del cliente desde la request que el browser envio al frontend.
//
// El Auth Service vive detras de Cloudflare. Cuando el frontend (Next.js SSR)
// llama al Auth Service, Cloudflare ve al frontend Cloud Run como "cliente" y
// pone su IP en CF-Connecting-IP del lado del Auth Service. Para que el audit
// log registre la IP REAL del usuario final, el frontend tiene que reenviarla
// en un header propio (X-Cliente-Ip).
//
// Este helper lee la IP del request que el browser nos envio al frontend.
// Cloudflare descarta cualquier valor falso del cliente, asi que el
// CF-Connecting-IP de esta request es confiable.

import type { NextRequest } from "next/server"

type RequestConHeaders = Pick<NextRequest, "headers"> | Request

function leerHeader(headers: Headers, nombre: string): string | null {
  const valor = headers.get(nombre)
  if (!valor) return null
  // X-Forwarded-For puede traer una lista "ip1, ip2"; nos quedamos con la primera.
  const primera = valor.split(",")[0]?.trim()
  return primera && primera.length > 0 ? primera : null
}

export function extraerIpCliente(request: RequestConHeaders): string | null {
  const headers = request.headers
  return (
    leerHeader(headers, "cf-connecting-ip") ??
    leerHeader(headers, "x-forwarded-for") ??
    leerHeader(headers, "x-real-ip")
  )
}
