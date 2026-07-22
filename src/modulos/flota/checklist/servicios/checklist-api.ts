import { clienteFlota } from "@/compartido/api/clientes-backend";
import type {
  FiltrosChecklists,
  IniciarChecklistPayload,
  Checklist,
  RegistrarRespuestasPayload,
  RespuestaPaginadaChecklists,
} from "../tipos/checklist.tipos";

// Capa de datos del flujo de ejecución de checklists (contexto `checklist`
// de BC04_Flota) para el NAVEGADOR. Mismo estandar: fetch con `clienteFlota`
// (BFF /api/flota), paths relativos al backend (`/flota/checklists`).

export async function listarChecklists(
  filtros: FiltrosChecklists = {},
): Promise<RespuestaPaginadaChecklists> {
  const { data } = await clienteFlota.get<RespuestaPaginadaChecklists>(
    "/flota/checklists",
    { params: filtros },
  );
  return data;
}

export async function obtenerChecklist(id: number): Promise<Checklist> {
  const { data } = await clienteFlota.get<{ datos: Checklist }>(
    `/flota/checklists/${id}`,
  );
  return data.datos;
}

export async function iniciarChecklist(
  payload: IniciarChecklistPayload,
): Promise<Checklist> {
  const { data } = await clienteFlota.post<{ datos: Checklist; mensaje: string }>(
    "/flota/checklists",
    payload,
  );
  return data.datos;
}

export async function anularChecklist(id: number): Promise<Checklist> {
  const { data } = await clienteFlota.patch<{ datos: Checklist; mensaje: string }>(
    `/flota/checklists/${id}/anular`,
    {},
  );
  return data.datos;
}

// Guardado EXPLÍCITO (deja evento de auditoría). Usar en acciones deliberadas
// del usuario (p. ej. un botón "Guardar"), no en el autoguardado por debounce.
export async function registrarRespuestas(
  id: number,
  payload: RegistrarRespuestasPayload,
): Promise<Checklist> {
  const { data } = await clienteFlota.patch<{ datos: Checklist; mensaje: string }>(
    `/flota/checklists/${id}/respuestas`,
    payload,
  );
  return data.datos;
}

// Autoguardado idempotente por debounce: no deja evento de auditoría de rutina.
export async function autoguardarRespuestas(
  id: number,
  payload: RegistrarRespuestasPayload,
): Promise<Checklist> {
  const { data } = await clienteFlota.patch<{ datos: Checklist; mensaje: string }>(
    `/flota/checklists/${id}/respuestas/autoguardar`,
    payload,
  );
  return data.datos;
}

export async function cerrarChecklist(id: number): Promise<Checklist> {
  const { data } = await clienteFlota.patch<{ datos: Checklist; mensaje: string }>(
    `/flota/checklists/${id}/cerrar`,
    {},
  );
  return data.datos;
}

// Descarga el PDF (HU-04-013): el backend arma el HTML y lo convierte vía
// Gotenberg. `responseType: "blob"` para no intentar parsear bytes de PDF
// como JSON.
export async function descargarPdfChecklist(id: number): Promise<Blob> {
  const { data } = await clienteFlota.get<Blob>(
    `/flota/checklists/${id}/pdf`,
    { responseType: "blob" },
  );
  return data;
}
