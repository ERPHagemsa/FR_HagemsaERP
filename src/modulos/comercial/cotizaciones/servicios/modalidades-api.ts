import { clienteComercial } from "@/compartido/api/clientes-backend";

import type {
  FiltrosModalidades,
  RespuestaPaginadaModalidades,
} from "../tipos/cotizaciones.tipos";

// GET /modalidades — catalogo de modalidades (solo lectura; CRUD en Epica 3)
export async function listarModalidades(
  filtros: FiltrosModalidades = {}
): Promise<RespuestaPaginadaModalidades> {
  const { data } = await clienteComercial.get<RespuestaPaginadaModalidades>(
    "/modalidades",
    { params: filtros }
  );
  return data;
}
