import { clienteFlota } from "@/compartido/api/clientes-backend";
import type {
  FiltrosInspecciones,
  IniciarInspeccionPayload,
  Inspeccion,
  RegistrarRespuestasPayload,
  RespuestaPaginadaInspecciones,
} from "../tipos/inspeccion.tipos";

// Capa de datos del flujo de Inspección (sub-contexto Checklist de BC04_Flota)
// para el NAVEGADOR. Mismo estandar: fetch con `clienteFlota` (BFF /api/flota),
// paths relativos al backend (`/flota/inspecciones`).

export async function listarInspecciones(
  filtros: FiltrosInspecciones = {},
): Promise<RespuestaPaginadaInspecciones> {
  const { data } = await clienteFlota.get<RespuestaPaginadaInspecciones>(
    "/flota/inspecciones",
    { params: filtros },
  );
  return data;
}

export async function obtenerInspeccion(id: string): Promise<Inspeccion> {
  const { data } = await clienteFlota.get<{ datos: Inspeccion }>(
    `/flota/inspecciones/${encodeURIComponent(id)}`,
  );
  return data.datos;
}

export async function iniciarInspeccion(
  payload: IniciarInspeccionPayload,
): Promise<Inspeccion> {
  const { data } = await clienteFlota.post<{ datos: Inspeccion; mensaje: string }>(
    "/flota/inspecciones",
    payload,
  );
  return data.datos;
}

export async function anularInspeccion(id: string): Promise<Inspeccion> {
  const { data } = await clienteFlota.patch<{ datos: Inspeccion; mensaje: string }>(
    `/flota/inspecciones/${encodeURIComponent(id)}/anular`,
    {},
  );
  return data.datos;
}

// Guardado EXPLÍCITO (deja evento de auditoría). Usar en acciones deliberadas
// del usuario (p. ej. un botón "Guardar"), no en el autoguardado por debounce.
export async function registrarRespuestas(
  id: string,
  payload: RegistrarRespuestasPayload,
): Promise<Inspeccion> {
  const { data } = await clienteFlota.patch<{ datos: Inspeccion; mensaje: string }>(
    `/flota/inspecciones/${encodeURIComponent(id)}/respuestas`,
    payload,
  );
  return data.datos;
}

// Autoguardado idempotente por debounce: no deja evento de auditoría de rutina.
export async function autoguardarRespuestas(
  id: string,
  payload: RegistrarRespuestasPayload,
): Promise<Inspeccion> {
  const { data } = await clienteFlota.patch<{ datos: Inspeccion; mensaje: string }>(
    `/flota/inspecciones/${encodeURIComponent(id)}/respuestas/autoguardar`,
    payload,
  );
  return data.datos;
}

export async function cerrarInspeccion(id: string): Promise<Inspeccion> {
  const { data } = await clienteFlota.patch<{ datos: Inspeccion; mensaje: string }>(
    `/flota/inspecciones/${encodeURIComponent(id)}/cerrar`,
    {},
  );
  return data.datos;
}

// Descarga el PDF (HU-04-013): el backend arma el HTML y lo convierte vía
// Gotenberg. `responseType: "blob"` para no intentar parsear bytes de PDF
// como JSON.
export async function descargarPdfInspeccion(id: string): Promise<Blob> {
  const { data } = await clienteFlota.get<Blob>(
    `/flota/inspecciones/${encodeURIComponent(id)}/pdf`,
    { responseType: "blob" },
  );
  return data;
}
