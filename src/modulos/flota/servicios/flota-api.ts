"use server";

import { obtenerConfiguracionApi } from "@/compartido/api/config";
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
  id: string;
  accion?: string | null;
  fechaAccion?: string | null;
  usuarioAccion?: string | null;
  datosAnteriores?: Record<string, unknown> | null;
  datosNuevos?: Record<string, unknown> | null;
};

type HistorialFlotaResponse = {
  datos?: HistorialFlotaItem[];
  placa?: string;
  contrato?: string;
  cuenta?: string;
};

function getApiUrl() {
  const cfg = obtenerConfiguracionApi("flota");
  return `${cfg.baseUrl}/flota/asignaciones-contratos`;
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
    // Diagnostic: log whether we have an access token available for the server-side call.
    try {
      console.debug("[flota-api] consultarConfiguracionGeneralActiva: tieneAccessToken=", Boolean(accessToken));
    } catch {}

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
      // Also forward the access cookie: some ERP endpoints validate cookie session server-side.
      headers.Cookie = `hagemsa_access=${accessToken}`;
      try {
        console.debug("[flota-api] consultarConfiguracionGeneralActiva: enviando Cookie hagemsa_access");
      } catch {}
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

    if (!res.ok) {
      console.error("[flota-api] consultarConfiguracionGeneralActiva fallo:", {
        url,
        status: res.status,
        statusText: res.statusText,
        body: texto,
      });
      return [];
    }

    let json: PaginatedResponse<ConfiguracionGeneralResponse> | null = null;
    try {
      json = texto.length ? (JSON.parse(texto) as PaginatedResponse<ConfiguracionGeneralResponse>) : null;
    } catch (e) {
      console.error("[flota-api] consultarConfiguracionGeneralActiva: fallo parseando JSON", { url, texto });
      return [];
    }

    if (!json || !Array.isArray(json.datos) || json.datos.length === 0) {
      console.warn("[flota-api] consultarConfiguracionGeneralActiva: respuesta vacia o datos no son array", {
        url,
        status: res.status,
        bodyText: texto,
      });
      return [];
    }

    return json.datos;
  } catch {
    limpiarTimeout(timeout);
    return [];
  }
}

export async function obtenerContratosDisponibles(): Promise<ContratoDisponibleFlota[]> {
  const [contratos, cuentas] = await Promise.all([
    consultarConfiguracionGeneralActiva("CONTRATO", 20),
    consultarConfiguracionGeneralActiva("CUENTA", 20),
  ]);
  const cuentasPorId = new Map(
    cuentas.map((cuenta) => [cuenta.id, toReferenciaFlota(cuenta)]),
  );
  try {
    console.debug("[flota-api] obtenerContratosDisponibles: counts", {
      contratos: contratos.length,
      cuentas: cuentas.length,
    });
  } catch {}

  const mapped = contratos.map((contrato) => toContratoDisponibleFlota(contrato, cuentasPorId));
  try {
    console.debug("[flota-api] obtenerContratosDisponibles: mappedCount", mapped.length);
  } catch {}

  return mapped;
}

export async function obtenerAsignaciones(): Promise<VehiculoFlota[]> {
  const { controller, timeout } = crearAbortController(3000);

  try {
    const res = await fetch(getApiUrl(), { cache: "no-store", signal: controller.signal });
    limpiarTimeout(timeout);
    if (!res.ok) return [];

    const json = (await res.json()) as { datos?: VehiculoFlota[] };
    return json.datos ?? [];
  } catch {
    limpiarTimeout(timeout);
    return [];
  }
}

export async function obtenerAsignacionPorPlaca(
  placa: string,
): Promise<VehiculoFlota | null> {
  const url = `${getApiUrl()}/${encodeURIComponent(placa)}`;
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
export async function obtenerHistorialPorPlaca(
  placa: string,
): Promise<HistorialFlotaResponse | null> {
  const url = `${getApiUrl()}/${encodeURIComponent(placa)}/historial`;
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
  placa: string,
  contrato: ReferenciaFlota | null,
  cuenta: ReferenciaFlota | null,
): Promise<RespuestaOperacion> {
  const { controller, timeout } = crearAbortController(5000);

  try {
    const res = await fetch(getApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placa, contrato, cuenta }),
      signal: controller.signal,
    });
    limpiarTimeout(timeout);

    if (res.ok) {
      revalidatePath("/flota");
      revalidatePath(`/flota/${encodeURIComponent(placa)}`);
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

export async function retirarContrato(placa: string): Promise<RespuestaOperacion> {
  const url = `${getApiUrl()}/${encodeURIComponent(placa)}/retirar`;
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
      revalidatePath(`/flota/${encodeURIComponent(placa)}`);
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
