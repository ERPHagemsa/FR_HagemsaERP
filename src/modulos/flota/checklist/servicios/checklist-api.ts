import { clienteFlota } from "@/compartido/api/clientes-backend";
import type { ColorRotulacion, TipoChecklist, TipoKit } from "../tipos/checklist.tipos";

// ── Tipos de checklist ────────────────────────────────────────────────────────

export async function obtenerTiposChecklist(): Promise<TipoChecklist[]> {
  try {
    const { data } = await clienteFlota.get<{ datos?: TipoChecklist[] }>(
      "/flota/tipos-checklist",
    );
    return data.datos ?? [];
  } catch {
    return [];
  }
}

// ── Tipos de kit ──────────────────────────────────────────────────────────────

export async function obtenerTiposKit(): Promise<TipoKit[]> {
  try {
    const { data } = await clienteFlota.get<{ datos?: TipoKit[] }>(
      "/flota/tipos-kit",
    );
    return data.datos ?? [];
  } catch {
    return [];
  }
}

// ── Colores de rotulación ─────────────────────────────────────────────────────

export async function obtenerColoresRotulacion(): Promise<ColorRotulacion[]> {
  try {
    const { data } = await clienteFlota.get<{ datos?: ColorRotulacion[] }>(
      "/flota/colores-rotulacion",
    );
    return data.datos ?? [];
  } catch {
    return [];
  }
}
