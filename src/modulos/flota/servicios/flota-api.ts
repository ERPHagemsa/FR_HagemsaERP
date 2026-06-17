"use server";

import { URLS_SERVIDOR } from "@/compartido/api/config-servidor";
import { obtenerAccessToken } from "@/compartido/autenticacion/sesion-servidor";
import { revalidatePath } from "next/cache";
import type {
  ConfiguracionGeneralResponse,
  PaginatedResponse,
} from "@/modulos/configuracion-general/tipos/configuracion-general";
import type {
  ContratoDisponibleFlota,
  ReferenciaFlota,
  VehiculoFlota,
} from "../tipos/flota.tipos";

type RespuestaOperacion = { success: boolean; mensaje: string };
type HistorialFlotaItem = {
  id: number;
  accion?: string | null;
  fechaAccion?: string | null;
  usuarioAccion?: string | null;
  datosAnteriores?: Record<string, unknown> | null;
  datosNuevos?: Record<string, unknown> | null;
};

type HistorialFlotaResponse = {
  datos?: HistorialFlotaItem[];
  unidadId?: string;
  contrato?: string;
  cuenta?: string;
};

function getAsignacionesApiUrl() {
  return `${URLS_SERVIDOR.flota}/flota/asignaciones-contratos`;
}

function getUnidadesApiUrl() {
  return `${URLS_SERVIDOR.flota}/flota/unidades`;
}

function crearAbortController(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeout };
}

function limpiarTimeout(timeout: ReturnType<typeof setTimeout>) {
  clearTimeout(timeout);
}

function mensajeErrorConexion(error: unknown) {
  if (error instanceof Error && error.name === "AbortError") {
    return "Tiempo de espera agotado. Verifica la conexion.";
  }

  return "No se pudo conectar al servicio de Flota";
}

function crearQueryString(params: Record<string, string | number>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    query.set(key, String(value));
  });

  return query.toString();
}

function toReferenciaFlota(dato: ConfiguracionGeneralResponse): ReferenciaFlota {
  return {
    id: dato.id,
    codigo: dato.codigo,
    nombre: dato.nombre,
  };
}

function toContratoDisponibleFlota(
  dato: ConfiguracionGeneralResponse,
  cuentasPorId: Map<string, ReferenciaFlota>,
): ContratoDisponibleFlota {
  return {
    ...toReferenciaFlota(dato),
    cuenta: dato.contratoPadreId
      ? cuentasPorId.get(dato.contratoPadreId) ?? null
      : null,
  };
}

async function consultarConfiguracionGeneralActiva(
  tipoDatoMaestro: "CONTRATO" | "CUENTA",
  pageSize = 20,
) {
  const query = crearQueryString({
    tipoDatoMaestro,
    estado: "ACTIVO",
    estadoRegistro: "ACTIVO",
    page: 1,
    pageSize,
    sortBy: "count",
    sortOrder: "desc",
  });
  const baseUrl = URLS_SERVIDOR.configuracionGeneral.replace(/\/+$/, "");
  const url = `${baseUrl}/configuracion-general?${query}`;
  const accessToken = await obtenerAccessToken();
  const { controller, timeout } = crearAbortController(5000);

  try {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
      headers.Cookie = `hagemsa_access=${accessToken}`;
    }

    const res = await fetch(url, {
      cache: "no-store",
      headers: Object.keys(headers).length ? headers : undefined,
      signal: controller.signal,
    });
    limpiarTimeout(timeout);
    let texto: string;
    try {
      texto = await res.text();
    } catch (e) {
      texto = "";
    }

    if (!res.ok) return [];

    let json: PaginatedResponse<ConfiguracionGeneralResponse> | null = null;
    try {
      json = texto.length ? (JSON.parse(texto) as PaginatedResponse<ConfiguracionGeneralResponse>) : null;
    } catch {
      return [];
    }

    if (!json || !Array.isArray(json.datos) || json.datos.length === 0) return [];

    return json.datos;
  } catch {
    limpiarTimeout(timeout);
    return [];
  }
}

export async function obtenerContratosDisponibles(): Promise<ContratoDisponibleFlota[]> {
  // BC_Flota mantiene una copia local sincronizada desde BC_ConfiguracionGeneral.
  // El frontend ya no depende directamente de BC_ConfiguracionGeneral para listar contratos.
  const url = `${URLS_SERVIDOR.flota}/flota/contratos`;
  const { controller, timeout } = crearAbortController(5000);

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    limpiarTimeout(timeout);

    if (!res.ok) return [];

    const json = (await res.json()) as { datos?: ContratoDisponibleFlota[] };
    return json.datos ?? [];
  } catch {
    limpiarTimeout(timeout);
    return [];
  }
}

export async function obtenerUnidades(): Promise<VehiculoFlota[]> {
  const { controller, timeout } = crearAbortController(3000);

  try {
    const res = await fetch(getUnidadesApiUrl(), { cache: "no-store", signal: controller.signal });
    limpiarTimeout(timeout);
    if (!res.ok) return [];

    const json = (await res.json()) as { datos?: VehiculoFlota[] };
    return json.datos ?? [];
  } catch {
    limpiarTimeout(timeout);
    return [];
  }
}

export async function obtenerUnidadPorId(id: string): Promise<VehiculoFlota | null> {
  const url = `${getUnidadesApiUrl()}/${encodeURIComponent(id)}`;
  const { controller, timeout } = crearAbortController(3000);

  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    limpiarTimeout(timeout);
    if (!res.ok) return null;

    const json = (await res.json()) as { datos?: VehiculoFlota };
    return json.datos ?? null;
  } catch {
    limpiarTimeout(timeout);
    return null;
  }
}

export async function obtenerAsignacionPorId(
  id: string,
): Promise<VehiculoFlota | null> {
  const url = `${getAsignacionesApiUrl()}/${encodeURIComponent(id)}`;
  const { controller, timeout } = crearAbortController(3000);

  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    limpiarTimeout(timeout);
    if (!res.ok) return null;

    const json = (await res.json()) as { datos?: VehiculoFlota };
    return json.datos ?? null;
  } catch {
    limpiarTimeout(timeout);
    return null;
  }
}

export async function obtenerHistorialPorId(
  id: string,
): Promise<HistorialFlotaResponse | null> {
  const url = `${getAsignacionesApiUrl()}/${encodeURIComponent(id)}/historial`;
  const { controller, timeout } = crearAbortController(5000);

  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    limpiarTimeout(timeout);
    if (!res.ok) return null;

    return (await res.json()) as HistorialFlotaResponse;
  } catch {
    limpiarTimeout(timeout);
    return null;
  }
}

export async function asignarContrato(
  unidadId: string,
  contrato: ReferenciaFlota | null,
  cuenta: ReferenciaFlota | null,
): Promise<RespuestaOperacion> {
  const { controller, timeout } = crearAbortController(5000);

  try {
    const res = await fetch(getAsignacionesApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unidadId, contrato, cuenta }),
      signal: controller.signal,
    });
    limpiarTimeout(timeout);

    if (res.ok) {
      revalidatePath("/flota");
      revalidatePath(`/flota/unidades/${encodeURIComponent(unidadId)}`);
      return {
        success: true,
        mensaje: `Contrato ${contrato?.codigo ?? ""} asignado exitosamente`,
      };
    }

    let mensajeError = "Error al actualizar el contrato";
    try {
      const errorJson = (await res.json()) as { message?: string };
      if (errorJson.message) mensajeError = errorJson.message;
    } catch {}

    return { success: false, mensaje: mensajeError };
  } catch (error) {
    limpiarTimeout(timeout);
    return { success: false, mensaje: mensajeErrorConexion(error) };
  }
}

export async function retirarContrato(unidadId: string): Promise<RespuestaOperacion> {
  const url = `${getAsignacionesApiUrl()}/${encodeURIComponent(unidadId)}/retirar`;
  const { controller, timeout } = crearAbortController(5000);

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: controller.signal,
    });
    limpiarTimeout(timeout);

    if (res.ok) {
      revalidatePath("/flota");
      revalidatePath(`/flota/unidades/${encodeURIComponent(unidadId)}`);
      return { success: true, mensaje: "Contrato retirado exitosamente" };
    }

    let mensajeError = "Error al retirar el contrato";
    try {
      const errorJson = (await res.json()) as { message?: string };
      if (errorJson.message) mensajeError = errorJson.message;
    } catch {}

    return { success: false, mensaje: mensajeError };
  } catch (error) {
    limpiarTimeout(timeout);
    return { success: false, mensaje: mensajeErrorConexion(error) };
  }
}

// ── Importación manual de unidades ───────────────────────────────────────────

export type ActivoDisponible = {
  id: string;
  codigo?: string | null;
  descripcion?: string | null;
  tipoActivo?: string | null;
  estadoActivo?: string | null;
  placa?: string | null;
  marca?: string | null;
  modelo?: string | null;
  vehiculo?: {
    placa?: string | null;
    placaRodaje?: string | null;
    marca?: string | null;
    modelo?: string | null;
    estadoOperativo?: string | null;
  } | null;
};

export async function obtenerActivosDisponibles(): Promise<ActivoDisponible[]> {
  const url = `${getUnidadesApiUrl()}/disponibles`;
  const { controller, timeout } = crearAbortController(8000);

  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    limpiarTimeout(timeout);
    if (!res.ok) return [];
    const json = (await res.json()) as { datos?: ActivoDisponible[] };
    return json.datos ?? [];
  } catch {
    limpiarTimeout(timeout);
    return [];
  }
}

export async function importarUnidades(ids: string[]): Promise<RespuestaOperacion> {
  const url = `${getUnidadesApiUrl()}/importar`;
  const { controller, timeout } = crearAbortController(10000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
      signal: controller.signal,
    });
    limpiarTimeout(timeout);

    if (res.ok) {
      revalidatePath("/flota");
      revalidatePath("/flota/unidades");
      return { success: true, mensaje: "Unidades importadas correctamente." };
    }

    let mensajeError = "Error al importar las unidades";
    try {
      const errorJson = (await res.json()) as { message?: string };
      if (errorJson.message) mensajeError = errorJson.message;
    } catch {}

    return { success: false, mensaje: mensajeError };
  } catch (error) {
    limpiarTimeout(timeout);
    return { success: false, mensaje: mensajeErrorConexion(error) };
  }
}
