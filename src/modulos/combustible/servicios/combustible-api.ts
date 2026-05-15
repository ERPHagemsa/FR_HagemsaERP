import type {
  AbastecimientoResponse,
  CrearAbastecimientoRequest,
  CrearSolicitudDesdeManifiestoRequest,
  HealthResponse,
  ManifiestoResponse,
  SolicitudResponse,
} from "../tipos/combustible";

const API_BASE_URL = "http://localhost:4001/api";

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
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

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
