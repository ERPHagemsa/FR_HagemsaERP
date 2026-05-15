import type {
  AbastecimientoResponse,
  CrearAbastecimientoRequest,
  CrearSolicitudDesdeManifiestoRequest,
  HealthResponse,
  ManifiestoResponse,
  SolicitudResponse,
} from "../tipos/combustible";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_COMBUSTIBLE_API_URL ?? "http://localhost:4001/api";
const REQUEST_TIMEOUT_MS = 6000;

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

export class CombustibleApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "CombustibleApiError";
    this.status = status;
  }
}

async function requestJson<T>(
  endpoint: string,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new CombustibleApiError(
        408,
        "La API de combustible no respondio a tiempo."
      );
    }

    throw new CombustibleApiError(
      0,
      "No se pudo conectar con la API de combustible."
    );
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;

    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = null;
    }

    const message = Array.isArray(payload?.message)
      ? payload.message.join(", ")
      : payload?.message || payload?.error || "No se pudo completar la operacion.";

    throw new CombustibleApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

export function obtenerHealthCombustible() {
  return requestJson<HealthResponse>("/health");
}

export function listarManifiestos() {
  return requestJson<ManifiestoResponse[]>("/manifiestos");
}

export function crearSolicitudDesdeManifiesto(
  data: CrearSolicitudDesdeManifiestoRequest,
) {
  return requestJson<SolicitudResponse>("/solicitudes/from-manifiesto", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function listarSolicitudes() {
  return requestJson<SolicitudResponse[]>("/solicitudes");
}

export function crearAbastecimiento(data: CrearAbastecimientoRequest) {
  return requestJson<AbastecimientoResponse>("/abastecimientos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function listarAbastecimientos() {
  return requestJson<AbastecimientoResponse[]>("/abastecimientos");
}
