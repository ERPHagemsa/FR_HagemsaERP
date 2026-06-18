import { ApiError } from "@/compartido/api/axios";
import { clienteFlota } from "@/compartido/api/clientes-backend";
import type {
  ContratoDisponibleFlota,
  ReferenciaFlota,
  VehiculoFlota,
} from "../tipos/flota.tipos";

// Capa de datos de Flota para el NAVEGADOR (Client Components).
//
// ESTANDAR: las vistas son "use client" y fetchean por aca con `clienteFlota`
// (BFF /api/flota, baseURL relativo). El Route Handler inyecta el bearer desde
// la cookie httpOnly; el JWT nunca se expone al JS del cliente. Los paths son
// relativos al backend de Flota (URLS_SERVIDOR.flota = .../api), por eso van
// como `/flota/<recurso>`.

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

function mensajeError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

// ── Lecturas ─────────────────────────────────────────────────────────────────

export async function obtenerContratosDisponibles(): Promise<
  ContratoDisponibleFlota[]
> {
  // BC_Flota mantiene una copia local sincronizada desde BC_ConfiguracionGeneral.
  try {
    const { data } = await clienteFlota.get<{ datos?: ContratoDisponibleFlota[] }>(
      "/flota/contratos",
    );
    return data.datos ?? [];
  } catch {
    return [];
  }
}

export async function obtenerCuentasDisponibles(): Promise<ReferenciaFlota[]> {
  // BC_Flota mantiene una copia local sincronizada desde BC_ConfiguracionGeneral.
  try {
    const { data } = await clienteFlota.get<{ datos?: ReferenciaFlota[] }>(
      "/flota/cuentas",
    );
    return data.datos ?? [];
  } catch {
    return [];
  }
}

export async function obtenerUnidades(): Promise<VehiculoFlota[]> {
  try {
    const { data } = await clienteFlota.get<{ datos?: VehiculoFlota[] }>(
      "/flota/unidades",
    );
    return data.datos ?? [];
  } catch {
    return [];
  }
}

export async function obtenerUnidadPorId(
  id: string,
): Promise<VehiculoFlota | null> {
  try {
    const { data } = await clienteFlota.get<{ datos?: VehiculoFlota }>(
      `/flota/unidades/${encodeURIComponent(id)}`,
    );
    return data.datos ?? null;
  } catch {
    return null;
  }
}

export async function obtenerAsignacionPorId(
  id: string,
): Promise<VehiculoFlota | null> {
  try {
    const { data } = await clienteFlota.get<{ datos?: VehiculoFlota }>(
      `/flota/asignaciones-contratos/${encodeURIComponent(id)}`,
    );
    return data.datos ?? null;
  } catch {
    return null;
  }
}

export async function obtenerHistorialPorId(
  id: string,
): Promise<HistorialFlotaResponse | null> {
  try {
    const { data } = await clienteFlota.get<HistorialFlotaResponse>(
      `/flota/asignaciones-contratos/${encodeURIComponent(id)}/historial`,
    );
    return data;
  } catch {
    return null;
  }
}

// ── Mutaciones ───────────────────────────────────────────────────────────────

export async function asignarContrato(
  unidadId: string,
  contrato: ReferenciaFlota | null,
  cuenta: ReferenciaFlota | null,
): Promise<RespuestaOperacion> {
  try {
    await clienteFlota.post("/flota/asignaciones-contratos", {
      unidadId,
      contrato,
      cuenta,
    });
    return {
      success: true,
      mensaje: `Contrato ${contrato?.codigo ?? ""} asignado exitosamente`,
    };
  } catch (error) {
    return {
      success: false,
      mensaje: mensajeError(error, "Error al actualizar el contrato"),
    };
  }
}

export async function retirarContrato(
  unidadId: string,
): Promise<RespuestaOperacion> {
  try {
    await clienteFlota.patch(
      `/flota/asignaciones-contratos/${encodeURIComponent(unidadId)}/retirar`,
      {},
    );
    return { success: true, mensaje: "Asignaciones retiradas exitosamente" };
  } catch (error) {
    return {
      success: false,
      mensaje: mensajeError(error, "Error al retirar las asignaciones"),
    };
  }
}

export async function retirarAsignacion(
  unidadId: string,
  asignacionId: number,
): Promise<RespuestaOperacion> {
  try {
    await clienteFlota.patch(
      `/flota/asignaciones-contratos/${encodeURIComponent(
        unidadId,
      )}/asignaciones/${asignacionId}/retirar`,
      {},
    );
    return { success: true, mensaje: "Asignacion retirada exitosamente" };
  } catch (error) {
    return {
      success: false,
      mensaje: mensajeError(error, "Error al retirar la asignacion"),
    };
  }
}

// ── Importación manual de unidades ───────────────────────────────────────────

export type ActivoDisponible = {
  id: string;
  codigo?: string | null;
  descripcion?: string | null;
  tipoActivo?: string | null;
  estadoActivo?: string | null;
  estadoOperativo?: string | null;
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
  try {
    const { data } = await clienteFlota.get<{ datos?: ActivoDisponible[] }>(
      "/flota/unidades/disponibles",
    );
    return data.datos ?? [];
  } catch {
    return [];
  }
}

export async function importarUnidades(
  ids: string[],
): Promise<RespuestaOperacion> {
  try {
    await clienteFlota.post("/flota/unidades/importar", { ids });
    return { success: true, mensaje: "Unidades importadas correctamente." };
  } catch (error) {
    return {
      success: false,
      mensaje: mensajeError(error, "Error al importar las unidades"),
    };
  }
}
