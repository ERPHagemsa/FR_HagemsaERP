"use server";

import { obtenerConfiguracionApi } from "@/compartido/api/config";
import { revalidatePath } from "next/cache";

function getApiUrl() {
  const cfg = obtenerConfiguracionApi("flota");
  return `${cfg.baseUrl}/flota/asignaciones-contratos`;
}

export async function obtenerAsignaciones() {
  const url = `${getApiUrl()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const json = await res.json() as { datos?: any[] };
    return json.datos ?? [];
  } catch (e) {
    return [];
  }
}

export async function obtenerAsignacionPorPlaca(placa: string) {
  const url = `${getApiUrl()}/${encodeURIComponent(placa)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json() as { datos?: any };
    return json.datos ?? null;
  } catch (e) {
    return null;
  }
}

export async function obtenerHistorialPorPlaca(placa: string) {
  const url = `${getApiUrl()}/${encodeURIComponent(placa)}/historial`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json() as {
      datos?: any[];
      placa?: string;
      contrato?: string;
      cuenta?: string;
    };
  } catch (e) {
    return null;
  }
}

export async function asignarContrato(
  placa: string,
  contrato: string
): Promise<{ success: boolean; mensaje: string }> {
  const url = `${getApiUrl()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placa, contrato }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      revalidatePath("/flota");
      revalidatePath(`/flota/${encodeURIComponent(placa)}`);
      return { success: true, mensaje: `Contrato ${contrato} asignado exitosamente` };
    }

    let mensajeError = "Error al actualizar el contrato";
    try {
      const errorJson = await res.json();
      if (errorJson?.message) mensajeError = errorJson.message;
    } catch (_) {}
    return { success: false, mensaje: mensajeError };
  } catch (e: any) {
    if (e?.name === "AbortError") {
      return { success: false, mensaje: "Tiempo de espera agotado. Verifica la conexión." };
    }
    return { success: false, mensaje: "No se pudo conectar al servicio de Flota" };
  }
}

export async function retirarContrato(
  placa: string
): Promise<{ success: boolean; mensaje: string }> {
  const url = `${getApiUrl()}/${encodeURIComponent(placa)}/retirar`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      revalidatePath("/flota");
      revalidatePath(`/flota/${encodeURIComponent(placa)}`);
      return { success: true, mensaje: "Contrato retirado exitosamente" };
    }

    let mensajeError = "Error al retirar el contrato";
    try {
      const errorJson = await res.json();
      if (errorJson?.message) mensajeError = errorJson.message;
    } catch (_) {}
    return { success: false, mensaje: mensajeError };
  } catch (e: any) {
    if (e?.name === "AbortError") {
      return { success: false, mensaje: "Tiempo de espera agotado. Verifica la conexión." };
    }
    return { success: false, mensaje: "No se pudo conectar al servicio de Flota" };
  }
}
