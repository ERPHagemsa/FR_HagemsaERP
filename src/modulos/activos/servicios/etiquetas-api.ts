import { clienteActivos } from "@/compartido/api/clientes-backend";
import type {
  AsignarEtiquetaPayload,
  Etiqueta,
  EtiquetaConsultaPublica,
  FiltrosEtiquetas,
  GenerarEtiquetasPayload,
} from "../tipos/etiquetas.tipos";

export async function obtenerEtiquetas(filtros?: FiltrosEtiquetas): Promise<Etiqueta[]> {
  const { data } = await clienteActivos.get<Etiqueta[]>("/activos/etiquetas", {
    params: filtros,
  });
  return Array.isArray(data) ? data : [];
}

export async function obtenerEtiquetaPorId(id: number): Promise<Etiqueta> {
  const { data } = await clienteActivos.get<Etiqueta>(`/activos/etiquetas/${id}`);
  return data;
}

export async function generarEtiquetas(
  payload: GenerarEtiquetasPayload
): Promise<Etiqueta[]> {
  const { data } = await clienteActivos.post<Etiqueta[]>("/activos/etiquetas", payload);
  return Array.isArray(data) ? data : [];
}

export async function resolverEtiquetaPorToken(token: string): Promise<Etiqueta> {
  const { data } = await clienteActivos.get<Etiqueta>(
    `/activos/etiquetas/token/${encodeURIComponent(token)}`
  );
  return data;
}

// Consulta PUBLICA (sin sesion): usada por /e/[token], la pagina que abre el
// QR fisico. Ruta marcada como publica en el BFF (src/app/api/activos/[[...path]]/route.ts).
export async function consultarEtiquetaPublica(
  token: string
): Promise<EtiquetaConsultaPublica> {
  const { data } = await clienteActivos.get<EtiquetaConsultaPublica>(
    `/activos/etiquetas/token/${encodeURIComponent(token)}/publico`
  );
  return data;
}

export async function asignarEtiqueta(
  id: number,
  payload: AsignarEtiquetaPayload
): Promise<Etiqueta> {
  const { data } = await clienteActivos.patch<Etiqueta>(
    `/activos/etiquetas/${id}/asignar`,
    payload
  );
  return data;
}
