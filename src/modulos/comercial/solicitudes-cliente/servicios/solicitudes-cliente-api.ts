import { clienteComercial } from "@/compartido/api/clientes-backend";

import type {
  PayloadBorrador,
  PayloadRegistrarSC,
} from "../../cotizaciones/tipos/cotizaciones.tipos";
import type {
  FiltrosResumenSolicitudes,
  FiltrosSolicitudesCliente,
  PayloadDescartarSC,
  RespuestaPaginadaSolicitudes,
  ResumenSolicitudesCliente,
  SolicitudCliente,
} from "../tipos/solicitud-cliente.tipos";

// ---------------------------------------------------------------------------
// Registro (migrado desde cotizaciones/servicios/solicitudes-cliente-api.ts)
// ---------------------------------------------------------------------------

// POST /solicitudes-cliente → 201 { id }
// La SC nace en PENDIENTE SIN cotizacion. Cotizar es un paso posterior y explicito
// via POST /solicitudes-cliente/:id/cotizaciones (ver agregarCotizacion).
export async function registrarSolicitudCliente(
  payload: PayloadRegistrarSC
): Promise<{ id: string }> {
  const { data } = await clienteComercial.post<{ id: string }>(
    "/solicitudes-cliente",
    payload
  );
  return data;
}

// ---------------------------------------------------------------------------
// Listado y consulta
// ---------------------------------------------------------------------------

// GET /solicitudes-cliente — listado paginado con filtros opcionales
export async function listarSolicitudesCliente(
  filtros: FiltrosSolicitudesCliente = {}
): Promise<RespuestaPaginadaSolicitudes> {
  const { data } = await clienteComercial.get<RespuestaPaginadaSolicitudes>(
    "/solicitudes-cliente",
    { params: filtros }
  );
  return data;
}

// GET /solicitudes-cliente/resumen — KPIs del pipeline (contadores agregados).
// Acepta solo filtros de contexto (origenTipo, origenId, busqueda); NO estado/bucket
// ni paginacion. Comparte predicado con el filtro `bucket` del listado.
export async function obtenerResumenSolicitudes(
  filtros: FiltrosResumenSolicitudes = {}
): Promise<ResumenSolicitudesCliente> {
  const { data } = await clienteComercial.get<ResumenSolicitudesCliente>(
    "/solicitudes-cliente/resumen",
    { params: filtros }
  );
  return data;
}

// GET /solicitudes-cliente/:id — detalle + refs ligeras de cotizaciones
export async function consultarSolicitudCliente(id: string): Promise<SolicitudCliente> {
  const { data } = await clienteComercial.get<SolicitudCliente>(
    `/solicitudes-cliente/${id}`
  );
  return data;
}

// POST /solicitudes-cliente/:id/cotizaciones — body { moneda?, secciones? } → 201 { idCotizacion }
// (el stand-by y el lead time viajan como atributos de cada linea dentro de secciones[])
// La cotizacion nace POBLADA (mismo body que PATCH /borrador, §5.4). NO existe canal de
// lineas raiz: toda linea va dentro de secciones[].lineas. Requiere >=1 linea activa entre
// las secciones; un body sin lineas devuelve 422.
export async function agregarCotizacion(
  id: string,
  payload: PayloadBorrador
): Promise<{ idCotizacion: string }> {
  const { data } = await clienteComercial.post<{ idCotizacion: string }>(
    `/solicitudes-cliente/${id}/cotizaciones`,
    payload
  );
  return data;
}

// PATCH /solicitudes-cliente/:id/descartar — { motivo } → 204
export async function descartarSolicitudCliente(
  id: string,
  payload: PayloadDescartarSC
): Promise<void> {
  await clienteComercial.patch(`/solicitudes-cliente/${id}/descartar`, payload);
}
