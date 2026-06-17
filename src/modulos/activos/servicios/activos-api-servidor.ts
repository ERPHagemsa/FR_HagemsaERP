// Capa de datos de Activos para SERVER COMPONENTS (RSC).
//
// POR QUE EXISTE: el cliente del navegador (activos-api.ts -> clienteActivos)
// usa baseURL RELATIVA "/api/activos" para pegarle al BFF same-origin. Eso solo
// resuelve en el browser. Las vistas de activos son async Server Components, asi
// que necesitan pegarle al backend con una URL ABSOLUTA e inyectar el token a
// mano. Mismo patron que flota-api.ts (URLS_SERVIDOR + obtenerAccessToken).
//
// REGLA: este modulo es server-only (importa next/headers via obtenerAccessToken).
// NUNCA importarlo desde un componente "use client" — romperia el build.
// Para fetch desde el navegador, usar activos-api.ts (cliente BFF).

import { URLS_SERVIDOR } from "@/compartido/api/config-servidor";
import { obtenerAccessToken } from "@/compartido/autenticacion/sesion-servidor";

import type {
  Activo,
  ActivoConfiguracionHistorica,
  ActivoHistorial,
  DocumentoActivo,
  EstadoRegistro,
  ImagenActivo,
  InventarioFisico,
  TanqueActivo,
} from "../tipos/activo.tipos";

const TIMEOUT_MS = 8000;

// GET directo al backend de Activos con el bearer de la cookie httpOnly.
// Devuelve el JSON parseado o lanza Error con mensaje legible (las vistas hacen
// .catch(() => []) o lo muestran con extraerMensajeError).
async function pedir<T>(
  path: string,
  query?: Record<string, string>,
): Promise<T> {
  const token = await obtenerAccessToken();
  const base = URLS_SERVIDOR.activos.replace(/\/+$/, "");
  const qs = query ? `?${new URLSearchParams(query).toString()}` : "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const respuesta = await fetch(`${base}${path}${qs}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!respuesta.ok) {
      throw new Error(
        `El servicio de activos respondio ${respuesta.status}.`,
      );
    }

    return (await respuesta.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Tiempo de espera agotado al consultar activos.");
    }
    if (error instanceof Error) throw error;
    throw new Error("No se pudo conectar con el servicio de activos.");
  } finally {
    clearTimeout(timeout);
  }
}

type ObtenerActivosParams = {
  estadoRegistro?: EstadoRegistro | "TODOS";
};

export async function obtenerActivos(
  params?: ObtenerActivosParams,
): Promise<Activo[]> {
  if (params?.estadoRegistro === "TODOS") {
    const [activos, anulados] = await Promise.all([
      obtenerActivos({ estadoRegistro: true }),
      obtenerActivos({ estadoRegistro: false }),
    ]);
    return [...activos, ...anulados];
  }

  const query =
    params?.estadoRegistro === undefined
      ? undefined
      : { estadoRegistro: String(params.estadoRegistro) };
  const data = await pedir<unknown>("/activos", query);

  if (Array.isArray(data)) {
    return data as Activo[];
  }
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { activos?: unknown }).activos)
  ) {
    return (data as { activos: Activo[] }).activos;
  }

  throw new Error("La API de activos no devolvio una lista.");
}

export async function obtenerActivoPorCodigo(codigo: string): Promise<Activo> {
  return pedir<Activo>(`/activos/codigo/${codigo}`);
}

export async function obtenerActivoPorId(id: number): Promise<Activo> {
  return pedir<Activo>(`/activos/${id}`);
}

export async function obtenerHistorialPorCodigo(
  codigo: string,
): Promise<ActivoHistorial[]> {
  const data = await pedir<ActivoHistorial[]>(
    `/activos/codigo/${codigo}/historial`,
  );
  return Array.isArray(data) ? data : [];
}

export async function obtenerConfiguracionHistoricaPorCodigo(
  codigo: string,
): Promise<ActivoConfiguracionHistorica[]> {
  const data = await pedir<ActivoConfiguracionHistorica[]>(
    `/activos/codigo/${codigo}/configuracion-historica`,
  );
  return Array.isArray(data) ? data : [];
}

export async function obtenerImagenesPorCodigo(
  codigo: string,
): Promise<ImagenActivo[]> {
  const data = await pedir<ImagenActivo[]>(
    `/activos/codigo/${codigo}/imagenes`,
  );
  return Array.isArray(data) ? data : [];
}

export async function obtenerDocumentosPorCodigo(
  codigo: string,
): Promise<DocumentoActivo[]> {
  const data = await pedir<DocumentoActivo[]>(
    `/activos/codigo/${codigo}/documentos`,
  );
  return Array.isArray(data) ? data : [];
}

export async function obtenerDocumentosPorActivoId(
  id: number,
): Promise<DocumentoActivo[]> {
  const data = await pedir<DocumentoActivo[]>(`/activos/${id}/documentos`);
  return Array.isArray(data) ? data : [];
}

export async function obtenerTanquesPorCodigo(
  codigo: string,
): Promise<TanqueActivo[]> {
  const data = await pedir<TanqueActivo[]>(
    `/activos/codigo/${codigo}/tanques`,
  );
  return Array.isArray(data) ? data : [];
}

export async function obtenerInventarioFisicoPorId(
  id: number,
): Promise<InventarioFisico> {
  return pedir<InventarioFisico>(`/activos/inventarios-fisicos/${id}`);
}

export async function obtenerInventariosFisicos(): Promise<InventarioFisico[]> {
  const data = await pedir<unknown>("/activos/inventarios-fisicos");

  if (Array.isArray(data)) {
    return data as InventarioFisico[];
  }
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { inventarios?: unknown }).inventarios)
  ) {
    return (data as { inventarios: InventarioFisico[] }).inventarios;
  }

  throw new Error("La API de inventario fisico no devolvio una lista.");
}
