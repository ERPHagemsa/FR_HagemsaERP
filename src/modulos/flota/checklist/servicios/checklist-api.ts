import { clienteFlota } from "@/compartido/api/clientes-backend";
import type {
  ColorRotulacion,
  CrearColorRotulacionPayload,
  CrearTipoChecklistPayload,
  CrearTipoKitPayload,
  EditarColorRotulacionPayload,
  EditarTipoChecklistPayload,
  EditarTipoKitPayload,
  FiltrosColoresRotulacion,
  FiltrosTiposChecklist,
  FiltrosTiposKit,
  RespuestaPaginada,
  TipoChecklist,
  TipoKit,
} from "../tipos/checklist.tipos";

// Capa de datos de Checklist (sub-contexto de BC04_Flota) para el NAVEGADOR.
// Mismo estandar que `asignaciones-api.ts`: fetch directo con `clienteFlota`
// (sin JWT), paths relativos al backend de Flota (`/flota/<recurso>`).

// ── Tipos de checklist (HU-04-005) ────────────────────────────────────────────

export async function listarTiposChecklist(
  filtros: FiltrosTiposChecklist = {},
): Promise<RespuestaPaginada<TipoChecklist>> {
  const { data } = await clienteFlota.get<RespuestaPaginada<TipoChecklist>>(
    "/flota/tipos-checklist",
    { params: filtros },
  );
  return data;
}

export async function crearTipoChecklist(
  payload: CrearTipoChecklistPayload,
): Promise<TipoChecklist> {
  const { data } = await clienteFlota.post<{ datos: TipoChecklist; mensaje: string }>(
    "/flota/tipos-checklist",
    payload,
  );
  return data.datos;
}

export async function editarTipoChecklist(
  id: string,
  payload: EditarTipoChecklistPayload,
): Promise<TipoChecklist> {
  const { data } = await clienteFlota.patch<{ datos: TipoChecklist; mensaje: string }>(
    `/flota/tipos-checklist/${encodeURIComponent(id)}`,
    payload,
  );
  return data.datos;
}

export async function anularTipoChecklist(id: string): Promise<TipoChecklist> {
  const { data } = await clienteFlota.patch<{ datos: TipoChecklist; mensaje: string }>(
    `/flota/tipos-checklist/${encodeURIComponent(id)}/anular`,
    {},
  );
  return data.datos;
}

// ── Tipos de kit (HU-04-006) ──────────────────────────────────────────────────

export async function listarTiposKit(
  filtros: FiltrosTiposKit = {},
): Promise<RespuestaPaginada<TipoKit>> {
  const { data } = await clienteFlota.get<RespuestaPaginada<TipoKit>>(
    "/flota/tipos-kit",
    { params: filtros },
  );
  return data;
}

export async function crearTipoKit(payload: CrearTipoKitPayload): Promise<TipoKit> {
  const { data } = await clienteFlota.post<{ datos: TipoKit; mensaje: string }>(
    "/flota/tipos-kit",
    payload,
  );
  return data.datos;
}

export async function editarTipoKit(
  id: string,
  payload: EditarTipoKitPayload,
): Promise<TipoKit> {
  const { data } = await clienteFlota.patch<{ datos: TipoKit; mensaje: string }>(
    `/flota/tipos-kit/${encodeURIComponent(id)}`,
    payload,
  );
  return data.datos;
}

export async function anularTipoKit(id: string): Promise<TipoKit> {
  const { data } = await clienteFlota.patch<{ datos: TipoKit; mensaje: string }>(
    `/flota/tipos-kit/${encodeURIComponent(id)}/anular`,
    {},
  );
  return data.datos;
}

// ── Colores de rotulación (HU-04-007) ─────────────────────────────────────────

export async function listarColoresRotulacion(
  filtros: FiltrosColoresRotulacion = {},
): Promise<RespuestaPaginada<ColorRotulacion>> {
  const { data } = await clienteFlota.get<RespuestaPaginada<ColorRotulacion>>(
    "/flota/colores-rotulacion",
    { params: filtros },
  );
  return data;
}

export async function crearColorRotulacion(
  payload: CrearColorRotulacionPayload,
): Promise<ColorRotulacion> {
  const { data } = await clienteFlota.post<{ datos: ColorRotulacion; mensaje: string }>(
    "/flota/colores-rotulacion",
    payload,
  );
  return data.datos;
}

export async function editarColorRotulacion(
  id: string,
  payload: EditarColorRotulacionPayload,
): Promise<ColorRotulacion> {
  const { data } = await clienteFlota.patch<{ datos: ColorRotulacion; mensaje: string }>(
    `/flota/colores-rotulacion/${encodeURIComponent(id)}`,
    payload,
  );
  return data.datos;
}

export async function anularColorRotulacion(id: string): Promise<ColorRotulacion> {
  const { data } = await clienteFlota.patch<{ datos: ColorRotulacion; mensaje: string }>(
    `/flota/colores-rotulacion/${encodeURIComponent(id)}/anular`,
    {},
  );
  return data.datos;
}
