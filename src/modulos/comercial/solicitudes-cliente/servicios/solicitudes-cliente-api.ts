import { clienteComercial } from "@/compartido/api/clientes-backend";

import type { PayloadRegistrarSC } from "../../cotizaciones/tipos/cotizaciones.tipos";
import type { TipoDocumento } from "../../prospectos/tipos/prospecto.tipos";
import type {
  FiltrosSolicitudesCliente,
  PayloadDescartarSC,
  RespuestaPaginadaSolicitudes,
  RespuestaResolverIdentidad,
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

// GET /solicitudes-cliente/:id — detalle + refs ligeras de cotizaciones
export async function consultarSolicitudCliente(id: string): Promise<SolicitudCliente> {
  const { data } = await clienteComercial.get<SolicitudCliente>(
    `/solicitudes-cliente/${id}`
  );
  return data;
}

// GET /solicitudes-cliente/resolver-identidad — ruta ESTATICA (nunca tratar como UUID)
// Query params: tipoDocumento, numeroDocumento
export async function resolverIdentidad(
  tipoDocumento: TipoDocumento,
  numeroDocumento: string
): Promise<RespuestaResolverIdentidad> {
  const { data } = await clienteComercial.get<RespuestaResolverIdentidad>(
    "/solicitudes-cliente/resolver-identidad",
    { params: { tipoDocumento, numeroDocumento } }
  );
  return data;
}

// POST /solicitudes-cliente/:id/cotizaciones — body {} → 201 { idCotizacion }
export async function agregarCotizacion(
  id: string
): Promise<{ idCotizacion: string }> {
  const { data } = await clienteComercial.post<{ idCotizacion: string }>(
    `/solicitudes-cliente/${id}/cotizaciones`,
    {}
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
