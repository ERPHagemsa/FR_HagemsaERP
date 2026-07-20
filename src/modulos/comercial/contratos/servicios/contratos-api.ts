import { clienteComercial } from "@/compartido/api/clientes-backend"

import type {
  Contrato,
  FiltrosContratos,
  PayloadCrearContratoDesdeTarifario,
  RespuestaListaContratos,
  TarifarioConsolidado,
} from "../tipos/contratos.tipos"

// GET /contratos — listado paginado con filtros.
export async function listarContratos(
  filtros: FiltrosContratos = {},
): Promise<RespuestaListaContratos> {
  const { data } = await clienteComercial.get<RespuestaListaContratos>(
    "/contratos",
    { params: filtros },
  )
  return data
}

// GET /contratos/:id — detalle del contrato.
export async function consultarContrato(id: string): Promise<Contrato> {
  const { data } = await clienteComercial.get<Contrato>(`/contratos/${id}`)
  return data
}

// POST /contratos/desde-tarifario/:idTarifario — el contrato nace del tarifario:
// hereda cliente + cotizacion origen y queda vinculado en un paso (201).
export async function crearContratoDesdeTarifario(
  idTarifario: string,
  payload: PayloadCrearContratoDesdeTarifario,
): Promise<{ id: string }> {
  const { data } = await clienteComercial.post<{ id: string }>(
    `/contratos/desde-tarifario/${idTarifario}`,
    payload,
  )
  return data
}

// GET /contratos/tarifario-consolidado/:idClienteExterno — tarifario consolidado
// del cliente (HU-03-025): union de las tarifas y cargos de sus contratos vigentes.
// El backend responde { tarifas, cargos } (no un array plano).
export async function consultarTarifarioConsolidado(
  idClienteExterno: string,
): Promise<TarifarioConsolidado> {
  const { data } = await clienteComercial.get<TarifarioConsolidado>(
    `/contratos/tarifario-consolidado/${idClienteExterno}`,
  )
  return data
}

