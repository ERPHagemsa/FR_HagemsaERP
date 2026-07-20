"use client";

import { useConsulta } from "@/compartido/api";

import { CLAVE_CALENDARIO_GANADAS } from "../../claves-consulta";
import type { RangoCalendario } from "../tipos/calendario.tipos";
import { listarEventosGanadas } from "./calendario-api";

// Refetch al cambiar el rango (navegacion de mes): `desde`/`hasta` son las deps.
// Solo lectura: no hay invalidarCalendarioGanadas — el dato solo cambia al ganar
// una cotizacion, en otra pantalla, y no se refleja en tiempo real (ver design D3).
export function useEventosCalendarioQuery(rango: RangoCalendario) {
  return useConsulta(() => listarEventosGanadas(rango), [rango.desde, rango.hasta], {
    clave: CLAVE_CALENDARIO_GANADAS,
  });
}
