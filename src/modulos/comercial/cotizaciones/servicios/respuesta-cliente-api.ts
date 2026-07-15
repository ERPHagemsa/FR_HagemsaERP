import { clienteComercial } from "@/compartido/api/clientes-backend";

import type {
  CotizacionPublica,
  RegistrarRespuestaPayload,
} from "../tipos/respuesta-cliente.tipos";

// Llamadas PUBLICAS (sin sesion): las usa /c/[token], la pagina que abre el
// cliente desde el correo. Las rutas estan marcadas como publicas en el BFF
// (src/app/api/comercial/[[...path]]/route.ts), asi que no se les inyecta bearer.

// GET /publico/cotizaciones/{token} — resumen + estado del enlace.
export async function consultarCotizacionPublica(
  token: string
): Promise<CotizacionPublica> {
  const { data } = await clienteComercial.get<CotizacionPublica>(
    `/publico/cotizaciones/${encodeURIComponent(token)}`
  );
  return data;
}

// POST /publico/cotizaciones/{token}/respuesta — el cliente responde (una sola vez).
export async function registrarRespuestaCliente(
  token: string,
  payload: RegistrarRespuestaPayload
): Promise<void> {
  await clienteComercial.post(
    `/publico/cotizaciones/${encodeURIComponent(token)}/respuesta`,
    payload
  );
}

// URL del PDF servido por el BFF. Se usa como src de un <iframe> / <a>, por eso
// es una URL y no una llamada: el navegador la pide directo.
export function urlPdfCotizacionPublica(token: string): string {
  return `/api/comercial/publico/cotizaciones/${encodeURIComponent(token)}/pdf`;
}
