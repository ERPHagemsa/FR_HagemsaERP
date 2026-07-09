import { clienteComercial } from "@/compartido/api/clientes-backend";

import type {
  Cotizacion,
  EjecutivoResponsableOpcion,
  FiltrosCotizaciones,
  FiltrosResumenCotizaciones,
  ParamsPrecioSugerido,
  PayloadActualizarCondicionesVersion,
  PayloadBorrador,
  PayloadEnviar,
  PayloadFijarNumeracion,
  PayloadNuevaVersion,
  PayloadPerdida,
  PrecioSugerido,
  RespuestaNumeracion,
  ResumenCotizaciones,
  RespuestaPaginadaCotizaciones,
  SugerenciaCarga,
} from "../tipos/cotizaciones.tipos";

// ---------------------------------------------------------------------------
// Listado, resumen y consulta
// ---------------------------------------------------------------------------

// GET /cotizaciones/resumen — KPIs del pipeline (contadores agregados).
// Acepta solo filtros de contexto (origenTipo, idEjecutivoResponsable, busqueda);
// NO estado/bucket ni paginacion. Comparte predicado con el filtro `bucket` del listado.
export async function obtenerResumenCotizaciones(
  filtros: FiltrosResumenCotizaciones = {}
): Promise<ResumenCotizaciones> {
  const { data } = await clienteComercial.get<ResumenCotizaciones>(
    "/cotizaciones/resumen",
    { params: filtros }
  );
  return data;
}

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

// GET /cotizaciones/cargas/sugerencias
// Autocompletado de cargas (API §5.3.1). Lectura GLOBAL: busca sobre todas las cargas
// activas de cualquier cotizacion y deduplica por nombre (trae la mas reciente).
// La respuesta es un ARRAY pelado de SugerenciaCarga (no `{ data }`).
// Reglas del backend: q con <2 chars (tras trim) devuelve []; limit default 10, tope 50.
export async function obtenerSugerenciasCarga(
  q: string,
  limit = 10
): Promise<SugerenciaCarga[]> {
  const { data } = await clienteComercial.get<SugerenciaCarga[]>(
    "/cotizaciones/cargas/sugerencias",
    { params: { q, limit } }
  );
  return data;
}

// GET /cotizaciones/ejecutivos — ejecutivos distintos que tienen cotizaciones.
// Respuesta en array pelado (sin envelope de paginacion ni { data, total }).
export async function obtenerEjecutivosCotizaciones(): Promise<EjecutivoResponsableOpcion[]> {
  const { data } = await clienteComercial.get<EjecutivoResponsableOpcion[]>(
    "/cotizaciones/ejecutivos"
  );
  return data;
}

// GET /cotizaciones/precio-sugerido (API §5.3.2)
// Sugiere un precio de referencia para una linea de TRANSPORTE a partir del historico
// (modalidad + ruta + carga). Solo lectura: no crea ni modifica nada. Es SOLO una
// referencia — el ejecutivo puede aceptarla o cotizar a criterio.
// `pesoTotal` (TN, > 0) es REQUERIDO: el backend exige saber el peso para cotizar transporte.
// Con clienteTipo + clienteId acota al historial de ese cliente (alcance "cliente"),
// con fallback a mercado si no tiene historial. La respuesta trae `alcance`, `ajustadoPorPeso`
// y `comparables`. SIN comparables: 200 con montos = null, muestras = 0, comparables [] y
// ajustadoPorPeso false (NO es error). axios omite del query string los params undefined.
export async function obtenerPrecioSugerido(
  params: ParamsPrecioSugerido
): Promise<PrecioSugerido> {
  const { data } = await clienteComercial.get<PrecioSugerido>(
    "/cotizaciones/precio-sugerido",
    { params }
  );
  return data;
}

// ---------------------------------------------------------------------------
// Escritura sobre el borrador
// ---------------------------------------------------------------------------

// PATCH /cotizaciones/:id/borrador → 204
// El body es el shape ANIDADO por seccion (ver PayloadBorrador).
// CRITICO: nunca enviar idSeccion, precioVenta, precioVentaTotal ni totales (los calcula el backend).
// precioBase y margenPct (requeridos) y cantidad (opcional) SI viajan a nivel de linea.
export async function actualizarBorrador(
  id: string,
  payload: PayloadBorrador
): Promise<void> {
  await clienteComercial.patch(`/cotizaciones/${id}/borrador`, payload);
}

// PATCH /cotizaciones/:id/condiciones → 204
export async function actualizarCondicionesVersion(
  idCotizacion: string,
  payload: PayloadActualizarCondicionesVersion
): Promise<void> {
  await clienteComercial.patch(`/cotizaciones/${idCotizacion}/condiciones`, payload);
}

// ---------------------------------------------------------------------------
// Transiciones de estado
// ---------------------------------------------------------------------------

// POST /cotizaciones/:id/enviar → 201 { id }
// El id devuelto es el de la SolicitudAprobacion creada, no el de la cotizacion.
// validezDias default = 10 (DELTA 3)
export async function solicitarAprobacion(
  id: string,
  payload?: PayloadEnviar
): Promise<{ id: string }> {
  const { data } = await clienteComercial.post<{ id: string }>(
    `/cotizaciones/${id}/enviar`,
    payload ?? {}
  );
  return data;
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
// Numeracion
// ---------------------------------------------------------------------------

// PUT /cotizaciones/numeracion → 200 { anio, proximoNumero } (API §5.5.1)
// Fija desde que numero continua la numeracion del año en curso (el backend
// resuelve el año; no se envia). NO emite ni crea cotizaciones: solo mueve el
// contador anual. Regla forward-only: proximoNumero <= al ultimo ya emitido → 409.
export async function fijarNumeracionCotizaciones(
  payload: PayloadFijarNumeracion
): Promise<RespuestaNumeracion> {
  const { data } = await clienteComercial.put<RespuestaNumeracion>(
    "/cotizaciones/numeracion",
    payload
  );
  return data;
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
