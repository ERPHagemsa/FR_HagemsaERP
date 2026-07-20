import { clienteFlota } from "@/compartido/api/clientes-backend";
import type {
  ColorRotulacion,
  CrearColorRotulacionPayload,
  CrearPlantillaPayload,
  CrearTipoChecklistPayload,
  CrearTipoKitPayload,
  CrearVersionPayload,
  EditarColorRotulacionPayload,
  EditarPlantillaPayload,
  EditarTipoChecklistPayload,
  EditarTipoKitPayload,
  FiltrosColoresRotulacion,
  FiltrosPlantillas,
  FiltrosTiposChecklist,
  FiltrosTiposKit,
  FiltrosVersionesPlantilla,
  Plantilla,
  PlantillaVersion,
  RedefinirEstructuraPayload,
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
  id: number,
  payload: EditarTipoChecklistPayload,
): Promise<TipoChecklist> {
  const { data } = await clienteFlota.patch<{ datos: TipoChecklist; mensaje: string }>(
    `/flota/tipos-checklist/${id}`,
    payload,
  );
  return data.datos;
}

export async function anularTipoChecklist(id: number): Promise<TipoChecklist> {
  const { data } = await clienteFlota.patch<{ datos: TipoChecklist; mensaje: string }>(
    `/flota/tipos-checklist/${id}/anular`,
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
  id: number,
  payload: EditarTipoKitPayload,
): Promise<TipoKit> {
  const { data } = await clienteFlota.patch<{ datos: TipoKit; mensaje: string }>(
    `/flota/tipos-kit/${id}`,
    payload,
  );
  return data.datos;
}

export async function anularTipoKit(id: number): Promise<TipoKit> {
  const { data } = await clienteFlota.patch<{ datos: TipoKit; mensaje: string }>(
    `/flota/tipos-kit/${id}/anular`,
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
  id: number,
  payload: EditarColorRotulacionPayload,
): Promise<ColorRotulacion> {
  const { data } = await clienteFlota.patch<{ datos: ColorRotulacion; mensaje: string }>(
    `/flota/colores-rotulacion/${id}`,
    payload,
  );
  return data.datos;
}

export async function anularColorRotulacion(id: number): Promise<ColorRotulacion> {
  const { data } = await clienteFlota.patch<{ datos: ColorRotulacion; mensaje: string }>(
    `/flota/colores-rotulacion/${id}/anular`,
    {},
  );
  return data.datos;
}

// ── Plantillas ─────────────────────────────────────────────────────────────────

// ¿Hay una PlantillaVersion publicada, variante ácido, para esta clase? Fuente
// de verdad en el backend (PlantillaVersion.criterioAplicabilidad) — evita
// mantener en el frontend una lista propia de clases con variante ácido.
export async function consultarDisponibilidadAcido(clase: string): Promise<boolean> {
  const { data } = await clienteFlota.get<{ disponible: boolean }>(
    "/flota/plantillas/acido-disponible",
    { params: { clase } },
  );
  return data.disponible;
}

export async function listarPlantillas(
  filtros: FiltrosPlantillas = {},
): Promise<RespuestaPaginada<Plantilla>> {
  const { data } = await clienteFlota.get<RespuestaPaginada<Plantilla>>(
    "/flota/plantillas",
    { params: filtros },
  );
  return data;
}

export async function crearPlantilla(payload: CrearPlantillaPayload): Promise<Plantilla> {
  const { data } = await clienteFlota.post<{ datos: Plantilla; mensaje: string }>(
    "/flota/plantillas",
    payload,
  );
  return data.datos;
}

export async function editarPlantilla(
  id: number,
  payload: EditarPlantillaPayload,
): Promise<Plantilla> {
  const { data } = await clienteFlota.patch<{ datos: Plantilla; mensaje: string }>(
    `/flota/plantillas/${id}`,
    payload,
  );
  return data.datos;
}

export async function anularPlantilla(id: number): Promise<Plantilla> {
  const { data } = await clienteFlota.patch<{ datos: Plantilla; mensaje: string }>(
    `/flota/plantillas/${id}/anular`,
    {},
  );
  return data.datos;
}

export async function listarVersionesPlantilla(
  plantillaId: number,
  filtros: FiltrosVersionesPlantilla = {},
): Promise<RespuestaPaginada<PlantillaVersion>> {
  const { data } = await clienteFlota.get<RespuestaPaginada<PlantillaVersion>>(
    `/flota/plantillas/${plantillaId}/versiones`,
    { params: filtros },
  );
  return data;
}

export async function crearVersionPlantilla(
  plantillaId: number,
  payload: CrearVersionPayload,
): Promise<PlantillaVersion> {
  const { data } = await clienteFlota.post<{ datos: PlantillaVersion; mensaje: string }>(
    `/flota/plantillas/${plantillaId}/versiones`,
    payload,
  );
  return data.datos;
}

export async function obtenerVersionPlantilla(versionId: number): Promise<PlantillaVersion> {
  const { data } = await clienteFlota.get<{ datos: PlantillaVersion; mensaje: string }>(
    `/flota/plantillas-versiones/${versionId}`,
  );
  return data.datos;
}

export async function redefinirEstructuraVersion(
  versionId: number,
  payload: RedefinirEstructuraPayload,
): Promise<PlantillaVersion> {
  const { data } = await clienteFlota.patch<{ datos: PlantillaVersion; mensaje: string }>(
    `/flota/plantillas-versiones/${versionId}/estructura`,
    payload,
  );
  return data.datos;
}

export async function publicarVersionPlantilla(versionId: number): Promise<PlantillaVersion> {
  const { data } = await clienteFlota.patch<{ datos: PlantillaVersion; mensaje: string }>(
    `/flota/plantillas-versiones/${versionId}/publicar`,
    {},
  );
  return data.datos;
}

export async function anularVersionPlantilla(versionId: number): Promise<PlantillaVersion> {
  const { data } = await clienteFlota.patch<{ datos: PlantillaVersion; mensaje: string }>(
    `/flota/plantillas-versiones/${versionId}/anular`,
    {},
  );
  return data.datos;
}
