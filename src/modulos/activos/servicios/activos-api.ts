import { clienteActivos } from "@/compartido/api/clientes-backend"

import type {
  Activo,
  ActualizarActivoPayload,
  CrearDocumentoActivoPayload,
  CrearImagenActivoPayload,
  CrearActivoPayload,
  CrearTanqueActivoPayload,
  DocumentoActivo,
  EstadoActivo,
  ImagenActivo,
  TanqueActivo,
} from "../tipos/activo.tipos"

export async function obtenerActivos(): Promise<Activo[]> {
  const { data } = await clienteActivos.get<Activo[]>("/activos")
  return data
}

export async function obtenerActivoPorCodigo(codigo: string): Promise<Activo> {
  const { data } = await clienteActivos.get<Activo>(
    `/activos/codigo/${codigo}`,
  )
  return data
}

export async function crearActivo(payload: CrearActivoPayload): Promise<Activo> {
  const { data } = await clienteActivos.post<Activo>("/activos", payload)
  return data
}

export async function actualizarActivo(
  id: string,
  payload: ActualizarActivoPayload,
): Promise<Activo> {
  const { data } = await clienteActivos.patch<Activo>(`/activos/${id}`, payload)
  return data
}

export async function cambiarEstadoActivo(
  id: string,
  payload: {
    estadoActivo: EstadoActivo
    motivo?: string
    usuario?: string
  },
): Promise<Activo> {
  const { data } = await clienteActivos.patch<Activo>(
    `/activos/${id}/estado-activo`,
    payload,
  )
  return data
}

export async function siniestrarActivo(
  id: string,
  payload: {
    observacion?: string
  },
): Promise<Activo> {
  const { data } = await clienteActivos.patch<Activo>(
    `/activos/${id}/siniestrar`,
    payload,
  )
  return data
}

export async function obtenerImagenesPorCodigo(
  codigo: string,
): Promise<ImagenActivo[]> {
  const { data } = await clienteActivos.get<ImagenActivo[]>(
    `/activos/codigo/${codigo}/imagenes`,
  )
  return data
}

export async function crearImagenPorCodigo(
  codigo: string,
  payload: CrearImagenActivoPayload,
): Promise<ImagenActivo> {
  const { data } = await clienteActivos.post<ImagenActivo>(
    `/activos/codigo/${codigo}/imagenes`,
    payload,
  )
  return data
}

export async function eliminarImagenPorCodigo(
  codigo: string,
  imagenId: string,
): Promise<void> {
  await clienteActivos.delete(
    `/activos/codigo/${codigo}/imagenes/${imagenId}`,
  )
}

export async function obtenerDocumentosPorCodigo(
  codigo: string,
): Promise<DocumentoActivo[]> {
  const { data } = await clienteActivos.get<DocumentoActivo[]>(
    `/activos/codigo/${codigo}/documentos`,
  )
  return data
}

export async function crearDocumentoPorCodigo(
  codigo: string,
  payload: CrearDocumentoActivoPayload,
): Promise<DocumentoActivo> {
  const { data } = await clienteActivos.post<DocumentoActivo>(
    `/activos/codigo/${codigo}/documentos`,
    payload,
  )
  return data
}

export async function obtenerTanquesPorCodigo(
  codigo: string,
): Promise<TanqueActivo[]> {
  const { data } = await clienteActivos.get<TanqueActivo[]>(
    `/activos/codigo/${codigo}/tanques`,
  )
  return data
}

export async function crearTanquePorCodigo(
  codigo: string,
  payload: CrearTanqueActivoPayload,
): Promise<TanqueActivo> {
  const { data } = await clienteActivos.post<TanqueActivo>(
    `/activos/codigo/${codigo}/tanques`,
    payload,
  )
  return data
}

export async function eliminarTanquePorCodigo(
  codigo: string,
  tanqueId: string,
): Promise<void> {
  await clienteActivos.delete(
    `/activos/codigo/${codigo}/tanques/${tanqueId}`,
  )
}
