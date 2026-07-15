import { clienteActivos } from "@/compartido/api/clientes-backend";

import type {
  ActualizarObservacionesDetallePayload,
  CandidatoInspeccion,
  CandidatoInspeccionFiltro,
  CerrarInspeccionPayload,
  CrearImagenInspeccionPayload,
  CrearInspeccionPayload,
  FormatoExportacionInspeccion,
  Inspeccion,
  InspeccionResumen,
  RegistrarActivosInspeccionPayload,
  SnapshotDetalleInspeccion,
} from "../tipos/inspeccion.tipos";

export async function obtenerInspecciones(): Promise<InspeccionResumen[]> {
  const { data } = await clienteActivos.get<InspeccionResumen[]>(
    "/activos/inspecciones"
  );
  return data;
}

export async function obtenerInspeccionPorId(id: number): Promise<Inspeccion> {
  const { data } = await clienteActivos.get<Inspeccion>(
    `/activos/inspecciones/${id}`
  );
  return data;
}

export async function aperturarInspeccion(
  payload: CrearInspeccionPayload
): Promise<Inspeccion> {
  const { data } = await clienteActivos.post<Inspeccion>(
    "/activos/inspecciones",
    payload
  );
  return data;
}

export async function obtenerCandidatosInspeccion(
  inspeccionId: number,
  filtro: CandidatoInspeccionFiltro
): Promise<CandidatoInspeccion[]> {
  const params: Record<string, string> = {};
  if (filtro.q) params.q = filtro.q;
  if (filtro.etiqueta) params.etiqueta = filtro.etiqueta;

  const { data } = await clienteActivos.get<CandidatoInspeccion[]>(
    `/activos/inspecciones/${inspeccionId}/candidatos`,
    { params }
  );
  return data;
}

export async function registrarActivosInspeccion(
  inspeccionId: number,
  payload: RegistrarActivosInspeccionPayload
): Promise<Inspeccion> {
  const { data } = await clienteActivos.post<Inspeccion>(
    `/activos/inspecciones/${inspeccionId}/detalles`,
    payload
  );
  return data;
}

export async function obtenerSnapshotDetalleInspeccion(
  inspeccionId: number,
  detalleId: number
): Promise<SnapshotDetalleInspeccion> {
  const { data } = await clienteActivos.get<SnapshotDetalleInspeccion>(
    `/activos/inspecciones/${inspeccionId}/detalles/${detalleId}/snapshot`
  );
  return data;
}

export async function actualizarObservacionesDetalle(
  inspeccionId: number,
  detalleId: number,
  payload: ActualizarObservacionesDetallePayload
): Promise<Inspeccion> {
  const { data } = await clienteActivos.patch<Inspeccion>(
    `/activos/inspecciones/${inspeccionId}/detalles/${detalleId}`,
    payload
  );
  return data;
}

export async function agregarImagenInspeccion(
  inspeccionId: number,
  detalleId: number,
  payload: CrearImagenInspeccionPayload
): Promise<Inspeccion> {
  const { data } = await clienteActivos.post<Inspeccion>(
    `/activos/inspecciones/${inspeccionId}/detalles/${detalleId}/imagenes`,
    payload
  );
  return data;
}

export async function eliminarImagenInspeccion(
  inspeccionId: number,
  detalleId: number,
  imagenId: number
): Promise<Inspeccion> {
  const { data } = await clienteActivos.delete<Inspeccion>(
    `/activos/inspecciones/${inspeccionId}/detalles/${detalleId}/imagenes/${imagenId}`
  );
  return data;
}

export async function cerrarInspeccion(
  id: number,
  payload: CerrarInspeccionPayload
): Promise<Inspeccion> {
  const { data } = await clienteActivos.patch<Inspeccion>(
    `/activos/inspecciones/${id}/cerrar`,
    payload
  );
  return data;
}

export async function exportarInspeccionPorActivo(
  inspeccionId: number,
  detalleId: number,
  formato: FormatoExportacionInspeccion
): Promise<Blob> {
  const { data } = await clienteActivos.get<Blob>(
    `/activos/inspecciones/${inspeccionId}/detalles/${detalleId}/exportar`,
    { params: { formato }, responseType: "blob" }
  );
  return data;
}

export async function exportarInspeccionGlobal(
  inspeccionId: number,
  formato: FormatoExportacionInspeccion
): Promise<Blob> {
  const { data } = await clienteActivos.get<Blob>(
    `/activos/inspecciones/${inspeccionId}/exportar`,
    { params: { formato }, responseType: "blob" }
  );
  return data;
}

// Dispara la descarga de un blob ya armado (Excel/PDF que devuelve el backend
// como StreamableFile). No usa Content-Disposition (axios no lo expone facil
// via blob response) — el nombre lo arma el caller.
export function descargarArchivoInspeccion(blob: Blob, nombreSugerido: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreSugerido;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
