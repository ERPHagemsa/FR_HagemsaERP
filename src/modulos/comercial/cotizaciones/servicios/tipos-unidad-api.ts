import { clienteComercial } from "@/compartido/api/clientes-backend";

import type { TipoUnidadOpcion } from "../tipos/cotizaciones.tipos";

// GET /tipos-unidad — catalogo unido (ACTIVOS + terceros) para el select de tipo de
// unidad de la carga (API §5.13). Devuelve un array PELADO (sin envoltorio { data, total }):
// no pagina ni filtra en el server (~30 items); el frontend filtra por texto en cliente.
export async function listarTiposUnidad(): Promise<TipoUnidadOpcion[]> {
  const { data } = await clienteComercial.get<TipoUnidadOpcion[]>("/tipos-unidad");
  return data;
}
