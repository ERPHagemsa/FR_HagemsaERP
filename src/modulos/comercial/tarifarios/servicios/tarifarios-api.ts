import { clienteComercial } from "@/compartido/api/clientes-backend"

import type {
  FiltrosTarifarios,
  PayloadActualizarTarifa,
  PayloadActualizarTarifaCargo,
  PayloadCrearTarifarioManual,
  PayloadEstablecerVigencia,
  PayloadTarifa,
  PayloadTarifaCargo,
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

// GET /tarifarios/:id — detalle con sus tarifas y cargos adicionales.
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

// PATCH /tarifarios/:id/vigencia — fija/actualiza el rango de vigencia (204).
export async function establecerVigenciaTarifario(
  id: string,
  payload: PayloadEstablecerVigencia,
): Promise<void> {
  await clienteComercial.patch(`/tarifarios/${id}/vigencia`, payload)
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

// POST /tarifarios/:id/cargos — agregar un cargo adicional (201).
export async function agregarTarifaCargo(
  idTarifario: string,
  payload: PayloadTarifaCargo,
): Promise<{ id: string }> {
  const { data } = await clienteComercial.post<{ id: string }>(
    `/tarifarios/${idTarifario}/cargos`,
    payload,
  )
  return data
}

// PATCH /tarifarios/:id/cargos/:idCargo — editar un cargo (204).
export async function actualizarTarifaCargo(
  idTarifario: string,
  idCargo: string,
  payload: PayloadActualizarTarifaCargo,
): Promise<void> {
  await clienteComercial.patch(
    `/tarifarios/${idTarifario}/cargos/${idCargo}`,
    payload,
  )
}

// DELETE /tarifarios/:id/cargos/:idCargo — quitar un cargo (204).
export async function eliminarTarifaCargo(
  idTarifario: string,
  idCargo: string,
): Promise<void> {
  await clienteComercial.delete(`/tarifarios/${idTarifario}/cargos/${idCargo}`)
}
