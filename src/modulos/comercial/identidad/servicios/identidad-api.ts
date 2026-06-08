import { clienteComercial } from "@/compartido/api/clientes-backend";

import type { TipoDocumento } from "../../prospectos/tipos/prospecto.tipos";
import type { RespuestaResolverIdentidad } from "../tipos/identidad.tipos";

// GET /solicitudes-cliente/resolver-identidad — ruta ESTATICA (nunca tratar como UUID).
// Query params: tipoDocumento, numeroDocumento.
// Determina si un documento corresponde a un cliente (BC-01), un prospecto local
// existente, o es nuevo. Lo usan el alta de SC y el alta de prospecto para evitar
// duplicar informacion.
export async function resolverIdentidad(
  tipoDocumento: TipoDocumento,
  numeroDocumento: string
): Promise<RespuestaResolverIdentidad> {
  const { data } = await clienteComercial.get<RespuestaResolverIdentidad>(
    "/solicitudes-cliente/resolver-identidad",
    { params: { tipoDocumento, numeroDocumento } }
  );
  return data;
}
