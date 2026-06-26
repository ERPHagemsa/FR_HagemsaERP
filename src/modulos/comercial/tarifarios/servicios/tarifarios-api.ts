import { clienteComercial } from "@/compartido/api/clientes-backend"

import type {
  FiltrosTarifarios,
  PayloadActualizarTarifa,
  PayloadCrearTarifarioManual,
  PayloadTarifa,
  RespuestaListaTarifarios,
  Tarifario,
} from "../tipos/tarifarios.tipos"

// GET /tarifarios — listado paginado con filtros.
export async function listarTarifarios(
  filtros: FiltrosTarifarios = {},
): Promise<RespuestaListaTarifarios> {
  const { data } = await clienteComercial.get<RespuestaListaTarifarios>(
    "/tarifarios",
    { params: filtros },
  )
  return data
}

// GET /tarifarios/:id — detalle con sus tarifas.
export async function consultarTarifario(id: string): Promise<Tarifario> {
  const { data } = await clienteComercial.get<Tarifario>(`/tarifarios/${id}`)
  return data
}

// POST /tarifarios — crear tarifario manual (201).
export async function crearTarifarioManual(
  payload: PayloadCrearTarifarioManual,
): Promise<{ id: string }> {
  const { data } = await clienteComercial.post<{ id: string }>(
    "/tarifarios",
    payload,
  )
  return data
}

// POST /tarifarios/desde-cotizacion/:idCotizacion — generar desde cotizacion (201).
export async function generarTarifarioDesdeCotizacion(
  idCotizacion: string,
): Promise<{ id: string }> {
  const { data } = await clienteComercial.post<{ id: string }>(
    `/tarifarios/desde-cotizacion/${idCotizacion}`,
  )
  return data
}

// PATCH /tarifarios/:id/anular (204).
export async function anularTarifario(id: string): Promise<void> {
  await clienteComercial.patch(`/tarifarios/${id}/anular`)
}

// POST /tarifarios/:id/tarifas — agregar una tarifa (201).
export async function agregarTarifa(
  idTarifario: string,
  payload: PayloadTarifa,
): Promise<{ id: string }> {
  const { data } = await clienteComercial.post<{ id: string }>(
    `/tarifarios/${idTarifario}/tarifas`,
    payload,
  )
  return data
}

// PATCH /tarifarios/:id/tarifas/:idTarifa — editar una tarifa (204).
export async function actualizarTarifa(
  idTarifario: string,
  idTarifa: string,
  payload: PayloadActualizarTarifa,
): Promise<void> {
  await clienteComercial.patch(
    `/tarifarios/${idTarifario}/tarifas/${idTarifa}`,
    payload,
  )
}

// DELETE /tarifarios/:id/tarifas/:idTarifa — quitar una tarifa (204).
export async function eliminarTarifa(
  idTarifario: string,
  idTarifa: string,
): Promise<void> {
  await clienteComercial.delete(`/tarifarios/${idTarifario}/tarifas/${idTarifa}`)
}
