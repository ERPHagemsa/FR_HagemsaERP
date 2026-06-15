import { clienteComercial } from "@/compartido/api/clientes-backend";

import type {
  Cotizacion,
  FiltrosCotizaciones,
  PayloadBorrador,
  PayloadEnviar,
  PayloadNuevaVersion,
  PayloadPerdida,
  RespuestaPaginadaCotizaciones,
} from "../tipos/cotizaciones.tipos";

// ---------------------------------------------------------------------------
// Listado y consulta
// ---------------------------------------------------------------------------

// GET /cotizaciones
export async function listarCotizaciones(
  filtros: FiltrosCotizaciones = {}
): Promise<RespuestaPaginadaCotizaciones> {
  const { data } = await clienteComercial.get<RespuestaPaginadaCotizaciones>(
    "/cotizaciones",
    { params: filtros }
  );
  return data;
}

// GET /cotizaciones/:id
export async function consultarCotizacion(id: string): Promise<Cotizacion> {
  const { data } = await clienteComercial.get<Cotizacion>(`/cotizaciones/${id}`);
  return data;
}

// ---------------------------------------------------------------------------
// Escritura sobre el borrador
// ---------------------------------------------------------------------------

// PATCH /cotizaciones/:id/borrador → 204
// El body es el shape ANIDADO por seccion (ver PayloadBorrador).
// CRITICO: nunca enviar idSeccion, precioTotal ni totales (los calcula el backend).
// precioUnitario (requerido) y cantidad (opcional) SI viajan a nivel de linea.
export async function actualizarBorrador(
  id: string,
  payload: PayloadBorrador
): Promise<void> {
  await clienteComercial.patch(`/cotizaciones/${id}/borrador`, payload);
}

// ---------------------------------------------------------------------------
// Transiciones de estado
// ---------------------------------------------------------------------------

// POST /cotizaciones/:id/enviar → 204
// validezDias default = 10 (DELTA 3)
export async function enviarCotizacion(
  id: string,
  payload?: PayloadEnviar
): Promise<void> {
  await clienteComercial.post(`/cotizaciones/${id}/enviar`, payload ?? {});
}

// POST /cotizaciones/:id/nueva-version → 204
export async function nuevaVersion(
  id: string,
  payload: PayloadNuevaVersion
): Promise<void> {
  await clienteComercial.post(`/cotizaciones/${id}/nueva-version`, payload);
}

// PATCH /cotizaciones/:id/ganada → 204 (sin body)
export async function marcarGanada(id: string): Promise<void> {
  await clienteComercial.patch(`/cotizaciones/${id}/ganada`);
}

// PATCH /cotizaciones/:id/perdida → 204
export async function marcarPerdida(
  id: string,
  payload: PayloadPerdida
): Promise<void> {
  await clienteComercial.patch(`/cotizaciones/${id}/perdida`, payload);
}

// PATCH /cotizaciones/:id/cancelar → 204 (sin body)
export async function cancelarCotizacion(id: string): Promise<void> {
  await clienteComercial.patch(`/cotizaciones/${id}/cancelar`);
}

// ---------------------------------------------------------------------------
// Documento PDF
// ---------------------------------------------------------------------------

// GET /cotizaciones/:id/pdf → 200 binario application/pdf
// Sin `version` imprime la version vigente; con `version=N` imprime esa version.
// Devuelve el Blob crudo — el consumidor decide abrirlo (objectURL) o descargarlo.
export async function obtenerPdfCotizacion(
  id: string,
  version?: number
): Promise<Blob> {
  const { data } = await clienteComercial.get<Blob>(`/cotizaciones/${id}/pdf`, {
    params: version !== undefined ? { version } : undefined,
    responseType: "blob",
  });
  return data;
}
