import { requestJson } from "@/compartido/api";
import type {
  Activo,
  ActualizarActivoPayload,
  CrearActivoPayload,
  CrearDocumentoActivoPayload,
  CrearImagenActivoPayload,
  CrearTanqueActivoPayload,
  DocumentoActivo,
  EstadoActivo,
  ImagenActivo,
  TanqueActivo,
} from "../tipos/activo.tipos";

export async function obtenerActivos() {
  return requestJson<Activo[]>({
    servicio: "activos",
    endpoint: "/activos",
    init: {
      cache: "no-store",
    },
    mensajeErrorDefault: "No se pudo obtener el listado de activos",
  });
}

export async function obtenerActivoPorCodigo(codigo: string) {
  return requestJson<Activo>({
    servicio: "activos",
    endpoint: `/activos/codigo/${codigo}`,
    init: {
      cache: "no-store",
    },
    mensajeErrorDefault: "No se pudo obtener el activo",
  });
}

export async function crearActivo(payload: CrearActivoPayload) {
  return requestJson<Activo>({
    servicio: "activos",
    endpoint: "/activos",
    init: {
      method: "POST",
      body: JSON.stringify(payload),
    },
    mensajeErrorDefault: "No se pudo crear el activo",
  });
}

export async function actualizarActivo(
  id: number,
  payload: ActualizarActivoPayload
) {
  return requestJson<Activo>({
    servicio: "activos",
    endpoint: `/activos/${id}`,
    init: {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    mensajeErrorDefault: "No se pudo actualizar el activo",
  });
}

export async function cambiarEstadoActivo(
  id: number,
  payload: {
    estadoActivo: EstadoActivo;
    motivo?: string;
    usuario?: string;
  }
) {
  return requestJson<Activo>({
    servicio: "activos",
    endpoint: `/activos/${id}/estado-activo`,
    init: {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    mensajeErrorDefault: "No se pudo cambiar el estado del activo",
  });
}

export async function siniestrarActivo(
  id: number,
  payload: {
    observacion?: string;
  }
) {
  return requestJson<Activo>({
    servicio: "activos",
    endpoint: `/activos/${id}/siniestrar`,
    init: {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    mensajeErrorDefault: "No se pudo siniestrar el activo",
  });
}

export async function obtenerImagenesPorCodigo(codigo: string) {
  return requestJson<ImagenActivo[]>({
    servicio: "activos",
    endpoint: `/activos/codigo/${codigo}/imagenes`,
    init: {
      cache: "no-store",
    },
    mensajeErrorDefault: "No se pudo obtener las imagenes del activo",
  });
}

export async function crearImagenPorCodigo(
  codigo: string,
  payload: CrearImagenActivoPayload
) {
  return requestJson<ImagenActivo>({
    servicio: "activos",
    endpoint: `/activos/codigo/${codigo}/imagenes`,
    init: {
      method: "POST",
      body: JSON.stringify(payload),
    },
    mensajeErrorDefault: "No se pudo registrar la imagen",
  });
}

export async function eliminarImagenPorCodigo(codigo: string, imagenId: number) {
  return requestJson<void>({
    servicio: "activos",
    endpoint: `/activos/codigo/${codigo}/imagenes/${imagenId}`,
    init: {
      method: "DELETE",
    },
    mensajeErrorDefault: "No se pudo eliminar la imagen",
  });
}

export async function obtenerDocumentosPorCodigo(codigo: string) {
  return requestJson<DocumentoActivo[]>({
    servicio: "activos",
    endpoint: `/activos/codigo/${codigo}/documentos`,
    init: {
      cache: "no-store",
    },
    mensajeErrorDefault: "No se pudo obtener los documentos del activo",
  });
}

export async function crearDocumentoPorCodigo(
  codigo: string,
  payload: CrearDocumentoActivoPayload
) {
  return requestJson<DocumentoActivo>({
    servicio: "activos",
    endpoint: `/activos/codigo/${codigo}/documentos`,
    init: {
      method: "POST",
      body: JSON.stringify(payload),
    },
    mensajeErrorDefault: "No se pudo registrar el documento",
  });
}

export async function eliminarDocumentoPorCodigo(
  codigo: string,
  documentoId: number
) {
  return requestJson<void>({
    servicio: "activos",
    endpoint: `/activos/codigo/${codigo}/documentos/${documentoId}`,
    init: {
      method: "DELETE",
    },
    mensajeErrorDefault: "No se pudo eliminar el documento",
  });
}

export async function obtenerTanquesPorCodigo(codigo: string) {
  return requestJson<TanqueActivo[]>({
    servicio: "activos",
    endpoint: `/activos/codigo/${codigo}/tanques`,
    init: {
      cache: "no-store",
    },
    mensajeErrorDefault: "No se pudo obtener los tanques del activo",
  });
}

export async function crearTanquePorCodigo(
  codigo: string,
  payload: CrearTanqueActivoPayload
) {
  return requestJson<TanqueActivo>({
    servicio: "activos",
    endpoint: `/activos/codigo/${codigo}/tanques`,
    init: {
      method: "POST",
      body: JSON.stringify(payload),
    },
    mensajeErrorDefault: "No se pudo registrar el tanque",
  });
}

export async function eliminarTanquePorCodigo(codigo: string, tanqueId: number) {
  return requestJson<void>({
    servicio: "activos",
    endpoint: `/activos/codigo/${codigo}/tanques/${tanqueId}`,
    init: {
      method: "DELETE",
    },
    mensajeErrorDefault: "No se pudo eliminar el tanque",
  });
}
