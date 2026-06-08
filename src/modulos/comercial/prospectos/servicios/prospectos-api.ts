import { clienteComercial } from "@/compartido/api/clientes-backend";

import type {
  FiltrosProspectos,
  PayloadAgregarContacto,
  PayloadActualizarProspecto,
  PayloadDescartarProspecto,
  PayloadRegistrarProspecto,
  Prospecto,
  RespuestaPaginadaProspectos,
} from "../tipos/prospecto.tipos";

// ---------------------------------------------------------------------------
// Listado y consulta
// ---------------------------------------------------------------------------

export async function listarProspectos(
  filtros: FiltrosProspectos = {}
): Promise<RespuestaPaginadaProspectos> {
  const { data } = await clienteComercial.get<RespuestaPaginadaProspectos>(
    "/prospectos",
    { params: filtros }
  );
  return data;
}

export async function consultarProspecto(id: string): Promise<Prospecto> {
  const { data } = await clienteComercial.get<Prospecto>(`/prospectos/${id}`);
  return data;
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export async function registrarProspecto(
  payload: PayloadRegistrarProspecto
): Promise<{ id: string }> {
  const { data } = await clienteComercial.post<{ id: string }>(
    "/prospectos",
    payload
  );
  return data;
}

// ---------------------------------------------------------------------------
// Actualizacion
// ---------------------------------------------------------------------------

export async function actualizarProspecto(
  id: string,
  payload: PayloadActualizarProspecto
): Promise<void> {
  await clienteComercial.patch(`/prospectos/${id}`, payload);
}

// ---------------------------------------------------------------------------
// Descarte
// ---------------------------------------------------------------------------

export async function descartarProspecto(
  id: string,
  payload: PayloadDescartarProspecto
): Promise<void> {
  await clienteComercial.patch(`/prospectos/${id}/descartar`, payload);
}

// ---------------------------------------------------------------------------
// Contactos
// ---------------------------------------------------------------------------

export async function agregarContacto(
  idProspecto: string,
  payload: PayloadAgregarContacto
): Promise<void> {
  await clienteComercial.post(
    `/prospectos/${idProspecto}/contactos`,
    payload
  );
}

export async function eliminarContacto(
  idProspecto: string,
  idContacto: string
): Promise<void> {
  await clienteComercial.delete(
    `/prospectos/${idProspecto}/contactos/${idContacto}`
  );
}

export async function cambiarContactoPrincipal(
  idProspecto: string,
  idContacto: string
): Promise<void> {
  // El PATCH .../principal no lleva body — se envía sin cuerpo
  await clienteComercial.patch(
    `/prospectos/${idProspecto}/contactos/${idContacto}/principal`
  );
}
