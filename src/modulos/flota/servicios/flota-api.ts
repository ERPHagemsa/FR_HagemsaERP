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
  console.debug("[flota-api] consultarConfiguracionGeneralActiva: url=", url);
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

// ─── Activos API (unidades desde el endpoint de activos) ──────────────

type ActivoApiResponse = {
  id: number;
  codigo: string;
  tipoActivo: string;
  descripcion: string;
  ubicacion: string;
  estadoActivo: string;
  estadoRegistro?: boolean;
  observacion: string | null;
  moneda: string | null;
  createdAt: string;
  updatedAt: string;
  vehiculo: {
    placa: string | null;
    marca: string | null;
    modelo: string | null;
    carroceria: string | null;
    estadoOperativo: string | null;
    estadoCalibracion: string | null;
    anioFabricacion: number | null;
    color: string | null;
    ejes: number | null;
    categoria: string | null;
    serieChasis: string | null;
    serieMotor: string | null;
  } | null;
};

async function consultarActivos(): Promise<ActivoApiResponse[]> {
  const cfg = obtenerConfiguracionApi("activos");
  const url = `${cfg.baseUrl.replace(/\/+$/, "")}/activos`;
  console.debug("[flota-api] consultarActivos: url=", url);
  const { controller, timeout } = crearAbortController(5000);

  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    limpiarTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json() as unknown;
    if (Array.isArray(data)) return data as ActivoApiResponse[];
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.activos)) return obj.activos as ActivoApiResponse[];
      if (Array.isArray(obj.datos)) return obj.datos as ActivoApiResponse[];
    }
    return [];
  } catch {
    limpiarTimeout(timeout);
    return [];
  }
}

function toVehiculoFlota(activo: ActivoApiResponse): VehiculoFlota {
  return {
    id: String(activo.id),
    codigo: activo.codigo,
    descripcion: activo.descripcion,
    tipoActivo: activo.tipoActivo,
    estadoActivo: activo.estadoActivo,
    estadoRegistro: activo.estadoRegistro === false ? "ANULADO" : "ACTIVO",
    ubicacion: activo.ubicacion,
    updatedAt: activo.updatedAt,
    placa: activo.vehiculo?.placa ?? null,
    placaRodaje: activo.vehiculo?.placa ?? null,
    marca: activo.vehiculo?.marca ?? null,
    modelo: activo.vehiculo?.modelo ?? null,
    carroceria: activo.vehiculo?.carroceria ?? null,
    estadoOperativo: activo.vehiculo?.estadoOperativo ?? null,
    contrato: null,
    cuenta: null,
    estado: null,
    vehiculo: activo.vehiculo
      ? {
          placaRodaje: activo.vehiculo.placa,
          marca: activo.vehiculo.marca,
          modelo: activo.vehiculo.modelo,
          carroceria: activo.vehiculo.carroceria,
          estadoOperativo: activo.vehiculo.estadoOperativo,
          estadoCalibracion: activo.vehiculo.estadoCalibracion,
        }
      : null,
  };
}

export async function obtenerUnidades(): Promise<VehiculoFlota[]> {
  const [activos, asignaciones] = await Promise.all([
    consultarActivos(),
    obtenerAsignaciones(),
  ]);

  const asignacionesPorPlaca = new Map<string, VehiculoFlota>();
  for (const asignacion of asignaciones) {
    const placa = asignacion.placa ?? asignacion.placaRodaje ?? "";
    if (placa) asignacionesPorPlaca.set(placa.toUpperCase(), asignacion);
  }

  return activos.map((activo) => {
      const flota = toVehiculoFlota(activo);
      const placa = (flota.placa ?? "").toUpperCase();
      const asignacion = asignacionesPorPlaca.get(placa);
      if (asignacion) {
        flota.contrato = asignacion.contrato;
        flota.cuenta = asignacion.cuenta;
      }
      return flota;
    });
}

export async function obtenerUnidadPorPlaca(placa: string): Promise<VehiculoFlota | null> {
  const [activos, asignacion] = await Promise.all([
    consultarActivos(),
    obtenerAsignacionPorPlaca(placa),
  ]);

  const activo = activos.find(
    (a) => a.vehiculo?.placa?.toUpperCase() === placa.toUpperCase(),
  );
  if (!activo) return asignacion;

  const flota = toVehiculoFlota(activo);
  if (asignacion) {
    flota.contrato = asignacion.contrato;
    flota.cuenta = asignacion.cuenta;
  }
  return flota;
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
