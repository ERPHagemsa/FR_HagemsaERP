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
} from "../tipos/activo.tipos";

const API_URL = process.env.NEXT_PUBLIC_ACTIVOS_API_URL ?? "https://api-activos-dev.hagemsa.com/api";;

function getApiUrl() {
  if (!API_URL) {
    throw new Error(
      "Falta configurar NEXT_PUBLIC_ACTIVOS_API_URL con la URL del backend de activos"
    );
  }

  return API_URL;
}

async function parseError(response: Response, fallback: string) {
  const text = await response.text();

  if (!text) return fallback;

  try {
    const parsed = JSON.parse(text) as { message?: string | string[] };
    const message = Array.isArray(parsed.message)
      ? parsed.message.join(". ")
      : parsed.message;

    return message || fallback;
  } catch {
    return text;
  }
}

export async function obtenerActivos() {
  const response = await fetch(`${getApiUrl()}/activos`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener el listado de activos");
  }

  return (await response.json()) as Activo[];
}

export async function obtenerActivoPorCodigo(codigo: string) {
  const response = await fetch(`${getApiUrl()}/activos/codigo/${codigo}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener el activo");
  }

  return (await response.json()) as Activo;
}

export async function crearActivo(payload: CrearActivoPayload) {
  const response = await fetch(`${getApiUrl()}/activos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "No se pudo crear el activo"));
  }

  return (await response.json()) as Activo;
}

export async function actualizarActivo(
  id: string,
  payload: ActualizarActivoPayload
) {
  const response = await fetch(`${getApiUrl()}/activos/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "No se pudo actualizar el activo"));
  }

  return (await response.json()) as Activo;
}

export async function cambiarEstadoActivo(
  id: string,
  payload: {
    estadoActivo: EstadoActivo;
    motivo?: string;
    usuario?: string;
  }
) {
  const response = await fetch(`${getApiUrl()}/activos/${id}/estado-activo`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, "No se pudo cambiar el estado del activo")
    );
  }

  return (await response.json()) as Activo;
}

export async function siniestrarActivo(
  id: string,
  payload: {
    observacion?: string;
  }
) {
  const response = await fetch(`${getApiUrl()}/activos/${id}/siniestrar`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "No se pudo siniestrar el activo"));
  }

  return (await response.json()) as Activo;
}

export async function obtenerImagenesPorCodigo(codigo: string) {
  const response = await fetch(`${getApiUrl()}/activos/codigo/${codigo}/imagenes`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener las imagenes del activo");
  }

  return (await response.json()) as ImagenActivo[];
}

export async function crearImagenPorCodigo(
  codigo: string,
  payload: CrearImagenActivoPayload
) {
  const response = await fetch(`${getApiUrl()}/activos/codigo/${codigo}/imagenes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "No se pudo registrar la imagen"));
  }

  return (await response.json()) as ImagenActivo;
}

export async function eliminarImagenPorCodigo(codigo: string, imagenId: string) {
  const response = await fetch(
    `${getApiUrl()}/activos/codigo/${codigo}/imagenes/${imagenId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(await parseError(response, "No se pudo eliminar la imagen"));
  }
}

export async function obtenerDocumentosPorCodigo(codigo: string) {
  const response = await fetch(`${getApiUrl()}/activos/codigo/${codigo}/documentos`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener los documentos del activo");
  }

  return (await response.json()) as DocumentoActivo[];
}

export async function crearDocumentoPorCodigo(
  codigo: string,
  payload: CrearDocumentoActivoPayload
) {
  const response = await fetch(`${getApiUrl()}/activos/codigo/${codigo}/documentos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "No se pudo registrar el documento"));
  }

  return (await response.json()) as DocumentoActivo;
}

export async function obtenerTanquesPorCodigo(codigo: string) {
  const response = await fetch(`${getApiUrl()}/activos/codigo/${codigo}/tanques`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener los tanques del activo");
  }

  return (await response.json()) as TanqueActivo[];
}

export async function crearTanquePorCodigo(
  codigo: string,
  payload: CrearTanqueActivoPayload
) {
  const response = await fetch(`${getApiUrl()}/activos/codigo/${codigo}/tanques`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "No se pudo registrar el tanque"));
  }

  return (await response.json()) as TanqueActivo;
}

export async function eliminarTanquePorCodigo(codigo: string, tanqueId: string) {
  const response = await fetch(
    `${getApiUrl()}/activos/codigo/${codigo}/tanques/${tanqueId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(await parseError(response, "No se pudo eliminar el tanque"));
  }
}
