import { clienteComercial } from "@/compartido/api/clientes-backend";

import type { EventoCalendario, RangoCalendario } from "../tipos/calendario.tipos";

// GET /cotizaciones/ganadas/calendario?desde=&hasta= → 200 EventoCalendario[] (array pelado)
// Solo lectura, sin paginacion (el rango visible acota el volumen). Visibilidad
// de area: no filtra por usuario/ejecutivo. Cero cambios de proxy — el catch-all
// app/api/comercial/[[...path]] ya reenvia la ruta al BC03.
export async function listarEventosGanadas(
  rango: RangoCalendario
): Promise<EventoCalendario[]> {
  const { data } = await clienteComercial.get<EventoCalendario[]>(
    "/cotizaciones/ganadas/calendario",
    { params: rango }
  );
  return data;
}
