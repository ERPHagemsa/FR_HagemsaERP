import { clienteFlota } from "@/compartido/api/clientes-backend";
import type {
  FiltrosInspecciones,
  IniciarInspeccionPayload,
  Inspeccion,
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
