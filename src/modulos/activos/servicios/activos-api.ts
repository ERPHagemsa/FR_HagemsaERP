import type {
  Activo,
  ActualizarActivoPayload,
  CrearImagenActivoPayload,
  CrearActivoPayload,
  EstadoActivo,
  ImagenActivo,
} from "../tipos/activo.tipos";

const API_URL = process.env.NEXT_PUBLIC_ACTIVOS_API_URL;

function getApiUrl() {
  if (!API_URL) {
    throw new Error(
      "Falta configurar NEXT_PUBLIC_ACTIVOS_API_URL con la URL del backend de activos"
    );
  }

  return API_URL;
}

async function parseError(response: Response, fallback: string) {
  const message = await response.text();
  return message || fallback;
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
