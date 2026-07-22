import { clienteConfiguracionGeneral } from "@/compartido/api/clientes-backend"

import type {
  AnularCostoOperativoRequest,
  CalcularCostoQuery,
  CalculoCostoResponse,
  CalculoTiempoCostoOperativoResponse,
  ChecklistCostoOperativoResponse,
  ConceptoCostoResponse,
  ConsultarConceptosCostoQuery,
  ConsultarCostosOperativosQuery,
  CostoOperativoResponse,
  CostoVigenteResponse,
  GuardarTramosCostoOperativoRequest,
  GuardarCostoOperativoRequest,
  HabilitarConceptoCostoRequest,
  InhabilitarConceptoCostoRequest,
  ModalidadEntrega,
  ModificarConceptoCostoRequest,
  PaginatedResponse,
  TipoCargaCosto,
  RegistrarConceptoCostoRequest,
  TramoCostoOperativoResponse,
} from "../tipos/costos-operativos"

const BASE = "/configuracion-general"

type RespuestaConDatos<T> = { datos: T }

function qs(query?: object): string {
  const params = new URLSearchParams()
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  })
  const s = params.toString()
  return s ? `?${s}` : ""
}

function extraerDatos<T>(respuesta: T | RespuestaConDatos<T>): T {
  if (
    respuesta &&
    typeof respuesta === "object" &&
    "datos" in respuesta
  ) {
    return (respuesta as RespuestaConDatos<T>).datos
  }
  return respuesta as T
}

// Normaliza una respuesta paginada que puede venir plana o envuelta una vez mas
// en el sobre estandar { datos: { datos: [...], paginacion } }.
function extraerPaginado<T>(
  respuesta: PaginatedResponse<T> | RespuestaConDatos<PaginatedResponse<T>>,
): PaginatedResponse<T> {
  if (
    respuesta &&
    typeof respuesta === "object" &&
    "datos" in respuesta &&
    !Array.isArray((respuesta as { datos: unknown }).datos) &&
    (respuesta as RespuestaConDatos<PaginatedResponse<T>>).datos &&
    Array.isArray((respuesta as RespuestaConDatos<PaginatedResponse<T>>).datos?.datos)
  ) {
    return (respuesta as RespuestaConDatos<PaginatedResponse<T>>).datos
  }
  return respuesta as PaginatedResponse<T>
}

// --- Catalogo de conceptos ------------------------------------------------

export async function listarConceptosCosto(
  query?: ConsultarConceptosCostoQuery,
): Promise<PaginatedResponse<ConceptoCostoResponse>> {
  const { data } = await clienteConfiguracionGeneral.get<
    | PaginatedResponse<ConceptoCostoResponse>
    | RespuestaConDatos<PaginatedResponse<ConceptoCostoResponse>>
  >(`${BASE}/conceptos-costo${qs(query)}`)
  return extraerPaginado(data)
}

export async function obtenerConceptoCosto(id: number): Promise<ConceptoCostoResponse> {
  const { data } = await clienteConfiguracionGeneral.get<
    ConceptoCostoResponse | RespuestaConDatos<ConceptoCostoResponse>
  >(`${BASE}/conceptos-costo/${id}`)
  return extraerDatos(data)
}

export async function registrarConceptoCosto(
  payload: RegistrarConceptoCostoRequest,
): Promise<ConceptoCostoResponse> {
  const { data } = await clienteConfiguracionGeneral.post<
    ConceptoCostoResponse | RespuestaConDatos<ConceptoCostoResponse>
  >(`${BASE}/conceptos-costo`, payload)
  return extraerDatos(data)
}

export async function modificarConceptoCosto(
  id: number,
  payload: ModificarConceptoCostoRequest,
): Promise<ConceptoCostoResponse> {
  const { data } = await clienteConfiguracionGeneral.put<
    ConceptoCostoResponse | RespuestaConDatos<ConceptoCostoResponse>
  >(`${BASE}/conceptos-costo/${id}`, payload)
  return extraerDatos(data)
}

// Pone el concepto en INACTIVO. Deja de salir en checklist y en costo vigente.
export async function inhabilitarConceptoCosto(
  id: number,
  payload?: InhabilitarConceptoCostoRequest,
): Promise<ConceptoCostoResponse> {
  const { data } = await clienteConfiguracionGeneral.patch<
    ConceptoCostoResponse | RespuestaConDatos<ConceptoCostoResponse>
  >(`${BASE}/conceptos-costo/${id}/inhabilitar`, payload)
  return extraerDatos(data)
}

export async function habilitarConceptoCosto(
  id: number,
  payload?: HabilitarConceptoCostoRequest,
): Promise<ConceptoCostoResponse> {
  const { data } = await clienteConfiguracionGeneral.patch<
    ConceptoCostoResponse | RespuestaConDatos<ConceptoCostoResponse>
  >(`${BASE}/conceptos-costo/${id}/habilitar`, payload)
  return extraerDatos(data)
}

// --- Checklist / paquete (ruta + cuenta/contrato + modalidad) --------------

export async function obtenerChecklistCostoOperativo(
  rutaId: number,
  cuentaContratoId: number | null,
  modalidadEntrega: ModalidadEntrega,
  tipoCarga: TipoCargaCosto,
  fecha?: string,
): Promise<ChecklistCostoOperativoResponse> {
  const { data } = await clienteConfiguracionGeneral.get<
    ChecklistCostoOperativoResponse | RespuestaConDatos<ChecklistCostoOperativoResponse>
  >(
    `${BASE}/costos-operativos/checklist${qs({ rutaId, cuentaContratoId, modalidadEntrega, tipoCarga, fecha })}`,
  )
  return extraerDatos(data)
}

// Crea el paquete si no existe; si cambia la tarifa, cierra el vigente y crea
// una nueva version (vigencia). Correccion del mismo dia reescribe en sitio.
export async function guardarCostoOperativo(
  payload: GuardarCostoOperativoRequest,
): Promise<CostoOperativoResponse> {
  const { data } = await clienteConfiguracionGeneral.post<
    CostoOperativoResponse | RespuestaConDatos<CostoOperativoResponse>
  >(`${BASE}/costos-operativos`, payload)
  return extraerDatos(data)
}

export async function listarCostosOperativos(
  query?: ConsultarCostosOperativosQuery,
): Promise<PaginatedResponse<CostoOperativoResponse>> {
  const { data } = await clienteConfiguracionGeneral.get<
    | PaginatedResponse<CostoOperativoResponse>
    | RespuestaConDatos<PaginatedResponse<CostoOperativoResponse>>
  >(`${BASE}/costos-operativos${qs(query)}`)
  return extraerPaginado(data)
}

export async function obtenerCostoOperativo(id: number): Promise<CostoOperativoResponse> {
  const { data } = await clienteConfiguracionGeneral.get<
    CostoOperativoResponse | RespuestaConDatos<CostoOperativoResponse>
  >(`${BASE}/costos-operativos/${id}`)
  return extraerDatos(data)
}

// Anula el paquete (estadoRegistro = ANULADO). No borra la fila.
export async function anularCostoOperativo(
  id: number,
  payload?: AnularCostoOperativoRequest,
): Promise<CostoOperativoResponse> {
  const { data } = await clienteConfiguracionGeneral.patch<
    CostoOperativoResponse | RespuestaConDatos<CostoOperativoResponse>
  >(`${BASE}/costos-operativos/${id}/anular`, payload)
  return extraerDatos(data)
}

export async function listarTramosCostoOperativo(
  id: number,
): Promise<TramoCostoOperativoResponse[]> {
  const { data } = await clienteConfiguracionGeneral.get<
    TramoCostoOperativoResponse[] | RespuestaConDatos<TramoCostoOperativoResponse[]>
  >(`${BASE}/costos-operativos/${id}/tramos`)
  return extraerDatos(data)
}

export async function guardarTramosCostoOperativo(
  id: number,
  payload: GuardarTramosCostoOperativoRequest,
): Promise<TramoCostoOperativoResponse[]> {
  const { data } = await clienteConfiguracionGeneral.put<
    TramoCostoOperativoResponse[] | RespuestaConDatos<TramoCostoOperativoResponse[]>
  >(`${BASE}/costos-operativos/${id}/tramos`, payload)
  return extraerDatos(data)
}

export async function calcularTiempoCostoOperativo(
  id: number,
  horasPorDia?: number,
): Promise<CalculoTiempoCostoOperativoResponse> {
  const { data } = await clienteConfiguracionGeneral.get<
    CalculoTiempoCostoOperativoResponse | RespuestaConDatos<CalculoTiempoCostoOperativoResponse>
  >(`${BASE}/costos-operativos/${id}/tiempo${qs({ horasPorDia })}`)
  return extraerDatos(data)
}

// --- Consumo / calculo (Operaciones / Caja) --------------------------------

export async function obtenerCostoVigente(
  rutaId: number,
  cuentaContratoId: number | null,
  modalidadEntrega: ModalidadEntrega,
  tipoCarga: TipoCargaCosto,
  fecha?: string,
): Promise<CostoVigenteResponse> {
  const { data } = await clienteConfiguracionGeneral.get<
    CostoVigenteResponse | RespuestaConDatos<CostoVigenteResponse>
  >(
    `${BASE}/costos-operativos/vigente${qs({ rutaId, cuentaContratoId, modalidadEntrega, tipoCarga, fecha })}`,
  )
  return extraerDatos(data)
}

// La config aplica la formula y devuelve el total por concepto y global.
export async function calcularCostoOperativo(
  query: CalcularCostoQuery,
): Promise<CalculoCostoResponse> {
  const { data } = await clienteConfiguracionGeneral.get<
    CalculoCostoResponse | RespuestaConDatos<CalculoCostoResponse>
  >(`${BASE}/costos-operativos/calcular${qs(query)}`)
  return extraerDatos(data)
}
