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

export async function consultarProspecto(id: number): Promise<Prospecto> {
  const { data } = await clienteComercial.get<Prospecto>(`/prospectos/${id}`);
  return data;
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export async function registrarProspecto(
  payload: PayloadRegistrarProspecto
): Promise<{ id: number }> {
  const { data } = await clienteComercial.post<{ id: number }>(
    "/prospectos",
    payload
  );
  return data;
}

// ---------------------------------------------------------------------------
// Actualizacion
// ---------------------------------------------------------------------------

export async function actualizarProspecto(
  id: number,
  payload: PayloadActualizarProspecto
): Promise<void> {
  await clienteComercial.patch(`/prospectos/${id}`, payload);
}

// ---------------------------------------------------------------------------
// Descarte
// ---------------------------------------------------------------------------

export async function descartarProspecto(
  id: number,
  payload: PayloadDescartarProspecto
): Promise<void> {
  await clienteComercial.patch(`/prospectos/${id}/descartar`, payload);
}

// ---------------------------------------------------------------------------
// Contactos
// ---------------------------------------------------------------------------

export async function agregarContacto(
  idProspecto: number,
  payload: PayloadAgregarContacto
): Promise<void> {
  await clienteComercial.post(
    `/prospectos/${idProspecto}/contactos`,
    payload
  );
}

export async function eliminarContacto(
  idProspecto: number,
  idContacto: number
): Promise<void> {
  await clienteComercial.delete(
    `/prospectos/${idProspecto}/contactos/${idContacto}`
  );
}

export async function cambiarContactoPrincipal(
  idProspecto: number,
  idContacto: number
): Promise<void> {
  await clienteComercial.patch(
    `/prospectos/${idProspecto}/contactos/${idContacto}/principal`,
    {}
  );
}
