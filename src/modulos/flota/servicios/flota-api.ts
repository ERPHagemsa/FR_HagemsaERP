import { obtenerConfiguracionApi } from "@/compartido/api/config";

function getApiUrl() {
  const cfg = obtenerConfiguracionApi("flota");
  return cfg.baseUrl;
}

async function parseJsonOrEmpty<T = any>(res: Response) {
  if (!res.ok) throw new Error("Error en backend de flota");
  return (await res.json()) as T;
}

export async function obtenerVehiculos() {
  const url = `${getApiUrl()}/vehiculos`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    const json = await parseJsonOrEmpty<{ items?: any[] }>(res);
    return json.items ?? [];
  } catch (e) {
    return [];
  }
}

export async function obtenerVehiculoPorId(id: string) {
  const url = `${getApiUrl()}/vehiculos/${encodeURIComponent(id)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as any;
  } catch (e) {
    return null;
  }
}

export default {
  obtenerVehiculos,
  obtenerVehiculoPorId,
};
